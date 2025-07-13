export class OpenAIService {
    static async chat(messages, context) {
        try {
            console.log('Sending request to /api/chat with', messages.length, 'messages');
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages, context })
            });
            
            console.log('Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Received response:', data);
            return data;
        } catch (error) {
            console.error('OpenAI service error:', error);
            
            // Return different messages based on error type
            if (error.message.includes('404')) {
                return {
                    reply: "The chat service isn't available. Make sure the server is running on port 5006.",
                    filter: false,
                    error: true
                };
            } else if (error.message.includes('500')) {
                return {
                    reply: "There's a server configuration issue. Please check the OpenAI API key in the .env file.",
                    filter: false,
                    error: true
                };
            } else {
                return {
                    reply: "I'm having trouble connecting to the chat service. Please try again.",
                    filter: false,
                    error: true
                };
            }
        }
    }
}