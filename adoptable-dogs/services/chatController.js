import { OpenAIService } from './openAIService.js';
import { ContextMapper } from './contextMapper.js';

export class ChatController {
    constructor() {
        this.messages = [];
        this.animalsData = [];
        this.isFiltered = false;
        this.initializeUI();
    }
    
    initializeUI() {
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.chatSend = document.getElementById('chat-send');
        this.toggleView = document.getElementById('toggleView');
        
        // Check if elements exist before setting up event listeners
        if (!this.chatMessages || !this.chatInput || !this.chatSend) {
            console.error('Chat elements not found in DOM');
            return;
        }
        
        // Set up event listeners
        this.chatSend.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        if (this.toggleView) {
            this.toggleView.addEventListener('click', () => this.toggleFilter());
        }
        
        // Send initial greeting
        this.addAssistantMessage("Hello! I'm Paw-finder, your adoption assistant. I'd love to help you find the perfect dog companion. To get started, could you tell me about your living situation? Do you have kids, other dogs, or cats at home?");
    }
    
    setAnimalsData(animals) {
        this.animalsData = animals;
        // Enable chat once we have data
        this.chatInput.disabled = false;
        this.chatSend.disabled = false;
    }
    
    // New method for setting specific dog context
    setDogContext(dogId) {
        this.dogId = dogId;
        this.dogContext = null;
        
        // Update the initial greeting for specific dog context
        if (this.chatMessages) {
            this.chatMessages.innerHTML = '';
            this.addAssistantMessage(`Hello! I'm Paw-finder, your adoption assistant. I see you're interested in learning more about this dog. I can help answer any questions you have about this specific dog or the adoption process. What would you like to know?`);
        }
        
        // Enable chat
        if (this.chatInput) this.chatInput.disabled = false;
        if (this.chatSend) this.chatSend.disabled = false;
    }
    
    // Method to get context for specific dog
    getDogSpecificContext() {
        if (this.dogContext) {
            return `SPECIFIC DOG INFORMATION:
Name: ${this.dogContext.name}
Breed: ${this.dogContext.breed}
Age: ${this.dogContext.age}
Sex: ${this.dogContext.sex}
Size: ${this.dogContext.size}
Traits: ${this.dogContext.traits.join(', ')}
Description: ${this.dogContext.description}

Please focus your response on this specific dog and provide helpful information about their characteristics, care needs, or the adoption process.`;
        }
        return '';
    }
    
    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;
        
        // Clear input and disable while processing
        this.chatInput.value = '';
        this.chatInput.disabled = true;
        this.chatSend.disabled = true;
        
        // Add user message to UI
        this.addUserMessage(message);
        
        // Add to message history
        this.messages.push({ role: 'user', content: message });
        
        // Show typing indicator
        const typingId = this.showTypingIndicator();
        
        try {
            // Get context - either specific dog or all animals
            let context;
            if (this.dogContext) {
                context = this.getDogSpecificContext();
            } else {
                context = ContextMapper.mapAnimalsToContext(this.animalsData);
            }
            console.log('Context size:', ContextMapper.getContextSize(context), 'tokens (approx)');
            
            // Send to OpenAI
            const response = await OpenAIService.chat(this.messages, context);
            
            // Remove typing indicator
            this.removeTypingIndicator(typingId);
            
            // Add assistant response
            this.addAssistantMessage(response.reply);
            this.messages.push({ role: 'assistant', content: response.reply });
            
            // Handle filtering if needed
            if (response.filter && response.animalIds && response.animalIds.length > 0) {
                this.applyFilter(response.animalIds, response.rationales);
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.removeTypingIndicator(typingId);
            this.addAssistantMessage("I'm sorry, I encountered an error. Please try again.");
        } finally {
            // Re-enable input
            this.chatInput.disabled = false;
            this.chatSend.disabled = false;
            this.chatInput.focus();
        }
    }
    
    addUserMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.className = 'chat-message user';
        messageEl.textContent = text;
        this.chatMessages.appendChild(messageEl);
        this.scrollToBottom();
    }
    
    addAssistantMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.className = 'chat-message assistant';
        messageEl.textContent = text;
        this.chatMessages.appendChild(messageEl);
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        const typingEl = document.createElement('div');
        typingEl.className = 'chat-message assistant typing';
        typingEl.id = `typing-${Date.now()}`;
        typingEl.innerHTML = '<span></span><span></span><span></span>';
        this.chatMessages.appendChild(typingEl);
        this.scrollToBottom();
        return typingEl.id;
    }
    
    removeTypingIndicator(id) {
        const typingEl = document.getElementById(id);
        if (typingEl) typingEl.remove();
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    applyFilter(animalIds, rationales) {
        this.isFiltered = true;
        this.filteredIds = animalIds;
        this.rationales = rationales;
        
        // Enable toggle button
        this.toggleView.disabled = false;
        this.toggleView.textContent = 'Show All Dogs';
        
        // Get all dog cards
        const dogCards = document.querySelectorAll('.dog-card');
        
        dogCards.forEach(card => {
            // Get animal ID from the card (we'll need to add this as a data attribute)
            const animalId = parseInt(card.dataset.animalId);
            
            if (animalIds.includes(animalId)) {
                // Show this card
                card.classList.remove('hidden');
                
                // Add rationale if available
                if (rationales && rationales[animalId]) {
                    this.addRationale(card, rationales[animalId]);
                }
            } else {
                // Hide this card
                card.classList.add('hidden');
            }
        });
        
        // Scroll to top of grid
        document.getElementById('dogGrid').scrollIntoView({ behavior: 'smooth' });
    }
    
    addRationale(card, rationale) {
        // Remove any existing rationale
        const existingRationale = card.querySelector('.rationale');
        if (existingRationale) existingRationale.remove();
        
        // Add new rationale
        const rationaleEl = document.createElement('div');
        rationaleEl.className = 'rationale';
        rationaleEl.textContent = rationale;
        
        // Insert after the dog-card-content
        const content = card.querySelector('.dog-card-content');
        if (content) {
            content.parentNode.insertBefore(rationaleEl, content.nextSibling);
        }
    }
    
    toggleFilter() {
        if (this.isFiltered) {
            // Show all dogs
            const dogCards = document.querySelectorAll('.dog-card');
            dogCards.forEach(card => {
                card.classList.remove('hidden');
                // Remove rationales
                const rationale = card.querySelector('.rationale');
                if (rationale) rationale.remove();
            });
            
            this.toggleView.textContent = 'Show Matches Only';
            this.isFiltered = false;
        } else if (this.filteredIds) {
            // Re-apply filter
            this.applyFilter(this.filteredIds, this.rationales);
            this.toggleView.textContent = 'Show All Dogs';
            this.isFiltered = true;
        }
    }
}