import { useAtom } from 'jotai'
import { FC, forwardRef } from 'react'
import {
    llmDefaultPromptAtom,
    llmDefaultProviderAtom,
    llmProvidersAtom
} from '../../hooks/Settings/states'
import { LLMSection, llmSectionSchema } from '../../hooks/Settings/types'
import './LLMSettings.css'
import LLMSettingsForm from './LLMSettings.form'
import { SettingRefAttrs } from './SettingRefAttrs'

const ModelSettings: FC<React.RefAttributes<SettingRefAttrs>> = forwardRef(
    (_, ref) => {
        // const [defaultPrompt, setDefaultPrompt] = useState('')
        // const [apiSource, setApiSource] = useState('official')
        // const [apiKey, setApiKey] = useState('')
        // const [defaultModel, setDefaultModel] = useState('GPT3.5')
        // const [customApiUrl, setCustomApiUrl] = useState('')


        const [llmDefaultPrompt, setLlmDefaultPrompt] = useAtom(llmDefaultPromptAtom)
        const [llmDefaultProvider, setLlmDefaultProvider] = useAtom(llmDefaultProviderAtom)
        const [llmProviders, setLlmProviders] = useAtom(llmProvidersAtom)

        const handleSubmit = (values: LLMSection) => {
            console.log('llm settings, submit', values)
            setLlmDefaultPrompt(values.defaultPrompt)
            setLlmDefaultProvider(values.defaultProvider)
            setLlmProviders(values.providers)
        }

        return (
            <LLMSettingsForm
                ref={ref}
                initialValues={{
                    defaultPrompt: llmDefaultPrompt,
                    defaultProvider: llmDefaultProvider,
                    providers: llmProviders,
                }}
                validationSchema={llmSectionSchema}
                onSubmit={handleSubmit}
            />

        )
    },
)

export default ModelSettings
