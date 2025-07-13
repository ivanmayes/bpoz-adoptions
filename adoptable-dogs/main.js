import { ASMService } from './api/asmService.js';

class DogAdoptionApp {
    constructor() {
        this.service = null;
        this.loadingEl = document.getElementById('loading');
        this.errorEl = document.getElementById('error');
        this.gridEl = document.getElementById('dogGrid');
    }

    async init() {
        try {
            const credentials = await this.loadCredentials();
            console.log('Credentials loaded:', { username: credentials.username, hasPassword: !!credentials.password });
            this.service = new ASMService(credentials.username, credentials.password);
            await this.loadDogs();
        } catch (error) {
            this.showError('Failed to initialize the application. Please check your credentials.');
            console.error('Initialization error:', error);
        }
    }

    async loadCredentials() {
        try {
            const response = await fetch('/api/env');
            const credentials = await response.json();
            return {
                username: credentials.ASM_USERNAME || '',
                password: credentials.ASM_PASSWORD || ''
            };
        } catch (error) {
            console.error('Failed to load credentials:', error);
            throw new Error('Failed to load API credentials');
        }
    }

    async loadDogs() {
        try {
            this.showLoading();
            
            const animals = await this.service.getAdoptable();
            console.log('All animals:', animals);
            
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
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to load adoptable dogs. Please try again later.');
            console.error('Error loading dogs:', error);
        }
    }

    displayDogs(dogs) {
        this.gridEl.innerHTML = '';
        
        dogs.forEach(dog => {
            const card = this.createDogCard(dog);
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
        card.href = this.service.animalViewUrl(animalId);
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.className = 'dog-card';
        
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