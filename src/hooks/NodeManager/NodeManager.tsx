/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dispatch, SetStateAction } from "react";
import { Connection, Edge, EdgeChange, MarkerType, Node, NodeChange } from "reactflow";
import { AppNodeType, AppNodeTypes } from "../../constants/nodeTypes";
import { SubManager } from "./SubManager";

export type NodeAddHandler = (node: Node) => void;
export type EdgeAddHandler = (edge: Edge) => void;
type OnChange<ChangesType> = (changes: ChangesType[]) => void;

export type NodeManagerOptions<NodeType extends AppNodeType, NodeData = any> = {
    // node
    nodes: Node[];
    setNodes: Dispatch<SetStateAction<Node<NodeData>[]>>;
    onNodesChange: OnChange<NodeChange>;
    // edge
    edges: Edge[];
    setEdges: Dispatch<SetStateAction<Edge[]>>;
    onEdgesChange: OnChange<EdgeChange>;
    // sub managers
    subManagers: Record<NodeType, SubManager<NodeType, NodeData>>;
};

export type AddNodeOptions<NodeType extends AppNodeType, NodeData = any, Preset = any> = {
    type: NodeType
    preset?: Preset
    data?: Partial<Node<NodeData, NodeType>>
}

export type NodeManagerSnapshot = ReturnType<NodeManager['snapshot']>;

export class NodeManager {
    private subManagers;
    private nodeTypes: Record<string, AppNodeType> = {};
    private edgeTypes: Record<string, string> = {};

    private _addNode: NodeAddHandler;
    private _removeNode: (nodeId: string) => void;
    private _nodes: Node[];
    get nodes() {
        return this._nodes;
    }

    private _addEdge: EdgeAddHandler;
    private _removeEdge: (edgeId: string) => void;
    private _edges: Edge[];
    get edges() {
        return this._edges;
    }

    onNodesChange: OnChange<NodeChange>;
    onEdgesChange: OnChange<EdgeChange>;

    private constructor(options: NodeManagerOptions<AppNodeTypes>) {
        this.subManagers = options.subManagers;

        this._addNode = (node: Node) => {
            options.setNodes((nodes) => nodes.concat(node));
        }
        this._removeNode = (nodeId: string) => {
            options.setNodes((nodes) => nodes.filter(node => node.id !== nodeId));
        }

        this._nodes = options.nodes;
        this.onNodesChange = options.onNodesChange;
        this.removeNode = this.removeNode.bind(this);
        this.addNode = this.addNode.bind(this);

        this._addEdge = (edge: Edge) => {
            options.setEdges((edges) => edges.concat(edge));
        }

        this._removeEdge = (edgeId: string) => {
            options.setEdges((edges) => edges.filter(edge => edge.id !== edgeId));
        }

        this._edges = options.edges;
        this.onEdgesChange = options.onEdgesChange;
        this.removeEdge = this.removeEdge.bind(this);
        this.addEdge = this.addEdge.bind(this);
        this.onConnect = this.onConnect.bind(this);
        this.createEdge = this.createEdge.bind(this);

    }

    static from(prev: NodeManager | undefined, options: NodeManagerOptions<AppNodeTypes>) {
        const manager = new NodeManager(options);
        if (!prev) {
            return manager;
        }
        if (!prev.nodeTypes) {
            throw new Error('prev.nodeMap is undefined');
        }
        manager.nodeTypes = prev.nodeTypes;
        manager.edgeTypes = prev.edgeTypes;
        return manager;
    }

    snapshot() {
        return {
            nodeMap: Object.fromEntries(this.nodes.map(node => [node.id, node])),
            edgeMap: Object.fromEntries(this.edges.map(edge => [edge.id, edge])),
            partitions: {
                ...Object.fromEntries(Object.entries(this.subManagers).map(([type, subManager]) => {
                    return [type, subManager.snapshot()];
                }))
            }
        };
    }

    restore(snapshot: NodeManagerSnapshot) {
        console.log('NodeManagerrestore', snapshot);
        if (this.nodes.length > 0) {
            throw new Error('already initialized');
        }

        Object.entries(snapshot.partitions).forEach(([type, partition]) => {
            const subManager = this.subManagers[type as AppNodeTypes];
            if (!subManager) {
                throw new Error(`factory for node type ${type} not found`);
            }
            subManager.restore(partition);
        });

        const { nodeMap, edgeMap } = snapshot;

        Object.values(nodeMap).forEach((node) => {
            this._addNode(node);
        });

        Object.values(edgeMap).forEach((edge) => {
            this._addEdge(edge);
        });
    }

    addNode(options: AddNodeOptions<AppNodeTypes>) {
        if (options.type === undefined) {
            throw new Error('options.type is undefined');
        }
        const subManager = this.subManagers[options.type];
        if (!subManager) {
            throw new Error(`factory for node type ${options.type} not found`);
        }
        const node = subManager.createNode(options);
        this.nodeTypes[node.id] = options.type;
        this._addNode(node);
    }

    removeNode(nodeId: string) {
        const type = this.nodeTypes[nodeId];
        if (type === undefined) {
            throw new Error(`node ${nodeId} has no type`);
        }
        const subManager = this.subManagers[type as AppNodeTypes];
        if (!subManager) {
            throw new Error(`factory for node type ${type} not found`);
        }
        subManager.destroyNode(nodeId);
        delete this.nodeTypes[nodeId];
        this._removeNode(nodeId);
    }

    addEdge(edge: Edge) {
        if (edge.type === undefined) {
            throw new Error('edge.type is undefined');
        }
        this.edgeTypes[edge.id] = edge.type;
        this._addEdge(edge);
    }

    removeEdge(edgeId: string) {
        const edge = this.edgeTypes[edgeId];
        if (!edge) {
            throw new Error(`edge ${edgeId} not found`);
        }
        delete this.edgeTypes[edgeId];
        this._removeEdge(edgeId);
    }

    onConnect(connection: Connection) {
        console.log('onConnect', connection);
        const edge = this.createEdge(connection);
        console.log('edge', edge);

        if (!edge) {
            return;
        }
        this.addEdge(edge);
    }

    createEdge(connection: Connection): Edge | undefined {
        if (!connection.source || !connection.target) {
            console.warn('connection source or target is undefined', connection);
            return undefined;
        }

        return {
            id: `${connection.source}-${connection.target}`,
            source: connection.source,
            target: connection.target,
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle,
            type: 'smoothstep',
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: '#4776dd',
            },
            style: {
                strokeWidth: 1.2,
                stroke: '#4776dd',
            },
        };
    }

}
