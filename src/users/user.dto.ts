export interface User {
    id: number;
    username: string;
    password: string;
    conversation_id: null | string;
    bot_id: string;
    bot_key: string;
    anim_permission: boolean
}

export interface NewBotInfointerface {
    id: string;
    name: string;
    description: string;
    mode: string;
    icon: string;
    icon_background: string;
    enable_site: boolean;
    enable_api: boolean;
    model_config: {
        opening_statement: string | null;
        suggested_questions: string[];
        suggested_questions_after_answer: {
            enabled: boolean;
        };
        speech_to_text: {
            enabled: boolean;
        };
        text_to_speech: {
            enabled: boolean;
        };
        retriever_resource: {
            enabled: boolean;
        };
        annotation_reply: {
            enabled: boolean;
        };
        more_like_this: {
            enabled: boolean;
        };
        sensitive_word_avoidance: {
            enabled: boolean;
            type: string;
            configs: any[];
        };
        external_data_tools: any[];
        model: {
            provider: string;
            name: string;
            mode: string;
            completion_params: any;
        };
        user_input_form: any[];
        dataset_query_variable: string | null;
        pre_prompt: string | null;
        agent_mode: {
            enabled: boolean;
            strategy: string | null;
            tools: any[];
            prompt: any | null;
        };
        prompt_type: string;
        chat_prompt_config: any;
        completion_prompt_config: any;
        dataset_configs: {
            retrieval_model: string;
        };
        file_upload: {
            image: {
                detail: string;
                enabled: boolean;
                number_limits: number;
                transfer_methods: string[];
            };
        };
        created_by: string;
        created_at: number;
        updated_by: string;
        updated_at: number;
    };
    workflow: any | null;
    tracing: any | null;
    use_icon_as_answer_icon: boolean;
    created_by: string;
    created_at: number;
    updated_by: string;
    updated_at: number;
}
