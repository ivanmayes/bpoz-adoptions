import { ASMService } from './api/asmService.js';
import { ChatController } from './services/chatController.js';

class DogAdoptionApp {
    constructor() {
        this.service = null;
        this.loadingEl = document.getElementById('loading');
        this.errorEl = document.getElementById('error');
        this.gridEl = document.getElementById('dogGrid');
        this.chatController = new ChatController();
        this.animalsData = [];
        this.chatSidebar = document.getElementById('chat-sidebar');
        this.mainContent = document.getElementById('main-content');
    }

    async init() {
        try {
            // No need to load credentials - handled server-side
            this.service = new ASMService();
            await this.loadDogs();
            this.setupEventListeners();
            this.checkUrlParams();
        } catch (error) {
            this.showError('Failed to initialize the application. Please try again later.');
            console.error('Initialization error:', error);
        }
    }
    
    checkUrlParams() {
        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const openAIBar = urlParams.get('openAIBar');
        
        // If openAIBar=true, automatically open the AI sidebar
        if (openAIBar === 'true') {
            this.showChatSidebar();
        }
    }
    
    setupEventListeners() {
        // Enable AI button
        const enableAiBtn = document.getElementById('enable-ai');
        if (enableAiBtn) {
            enableAiBtn.addEventListener('click', () => {
                this.showChatSidebar();
            });
        }
        
        // Close chat button
        const closeChatBtn = document.getElementById('close-chat');
        if (closeChatBtn) {
            closeChatBtn.addEventListener('click', () => {
                this.hideChatSidebar();
            });
        }
    }
    
    showChatSidebar() {
        this.chatSidebar.style.display = 'flex';
        // Hide the promo alert
        const promoAlert = document.querySelector('.ai-promo-alert');
        if (promoAlert) {
            promoAlert.style.display = 'none';
        }
        // Small delay to ensure display is set before animation
        setTimeout(() => {
            this.chatSidebar.classList.remove('hidden');
            this.mainContent.classList.remove('expanded');
        }, 10);
    }
    
    hideChatSidebar() {
        this.chatSidebar.classList.add('hidden');
        this.mainContent.classList.add('expanded');
        // Show the promo alert again
        const promoAlert = document.querySelector('.ai-promo-alert');
        if (promoAlert) {
            promoAlert.style.display = 'flex';
        }
        // Hide completely after animation
        setTimeout(() => {
            this.chatSidebar.style.display = 'none';
        }, 300);
    }


    async loadDogs() {
        try {
            this.showLoading();
            
            const animals = await this.service.getAdoptable();
            console.log('All animals:', animals);
            
            // Store all animals data for chat
            this.animalsData = animals;
            
            // Check both uppercase and lowercase field names
            const dogs = animals.filter(animal => {
                const speciesName = animal.SPECIESNAME || animal.speciesname;
                return speciesName && speciesName.toLowerCase() === 'dog';
            });
            console.log('Filtered dogs:', dogs);
            if (dogs.length > 0) {
                console.log('First dog example:', dogs[0]);
                console.log('Field names:', Object.keys(dogs[0]));
            }

            this.hideLoading();

            if (dogs.length === 0) {
                this.showEmptyState();
                return;
            }

            this.displayDogs(dogs);
            
            // Pass animals data to chat controller
            this.chatController.setAnimalsData(animals);
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to load adoptable dogs. Please try again later.');
            console.error('Error loading dogs:', error);
        }
    }

    displayDogs(dogs) {
        this.gridEl.innerHTML = '';
        
        dogs.forEach((dog, index) => {
            const card = this.createDogCard(dog);
            // Add staggered entrance animation
            card.classList.add('filtering-in');
            card.style.animationDelay = `${index * 0.03}s`;
            this.gridEl.appendChild(card);
        });
    }

    createDogCard(dog) {
        // Handle both uppercase and lowercase field names
        const animalId = dog.ANIMALID || dog.animalid || dog.ID || dog.id;
        const animalName = dog.ANIMALNAME || dog.animalname || 'Unknown';
        const animalAge = dog.ANIMALAGE || dog.animalage || 'Age unknown';
        const breedName = dog.BREEDNAME || dog.breedname || 'Mixed breed';
        const sexName = dog.SEXNAME || dog.sexname || '';
        
        // Debug: Check if animalId exists
        if (!animalId) {
            console.error('No animal ID found for dog:', dog);
            console.log('Available fields:', Object.keys(dog));
        }
        
        const card = document.createElement('a');
        card.href = `dog-detail.html?id=${animalId}`;
        card.className = 'dog-card';
        card.dataset.animalId = animalId; // Add animal ID for filtering
        
        const thumbnailUrl = this.service.thumbnailUrl(animalId);
        console.log('Dog:', animalName, 'ID:', animalId, 'Thumbnail URL:', thumbnailUrl);
        console.log('Animal View URL:', card.href);
        
        const age = animalAge;
        const breed = breedName;
        const sex = sexName;
        
        card.innerHTML = `
            <img src="${thumbnailUrl}" 
                 alt="${animalName}" 
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/280x280?text=No+Photo'">
            <div class="dog-card-content">
                <h3>${animalName}</h3>
                <p class="breed">${breed}</p>
                <p>${age} • ${sex}</p>
            </div>
        `;
        
        return card;
    }

    showLoading() {
        this.loadingEl.style.display = 'block';
        this.errorEl.style.display = 'none';
        this.gridEl.innerHTML = '';
    }

    hideLoading() {
        this.loadingEl.style.display = 'none';
    }

    showError(message) {
        this.errorEl.textContent = message;
        this.errorEl.style.display = 'block';
    }

    showEmptyState() {
        this.gridEl.innerHTML = `
            <div class="empty-state">
                <h2>No dogs available right now</h2>
                <p>Please check back later for new adoptable dogs!</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new DogAdoptionApp();
    app.init();
});