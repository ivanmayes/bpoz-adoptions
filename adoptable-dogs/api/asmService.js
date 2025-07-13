export class ASMService {
    #base = 'https://service.sheltermanager.com/asmservice';
    #account = 'km2607';
    #username = '';
    #password = '';
    #useProxy = false; // Disable proxy for now, use direct API calls

    constructor(username, password) {
        this.#username = username || '';
        this.#password = password || '';
    }

    async getAdoptable() {
        let url;
        if (this.#useProxy) {
            url = '/api/asm/json_adoptable_animals';
        } else {
            url = `${this.#base}?account=${this.#account}&method=json_adoptable_animals&username=${this.#username}&password=${this.#password}`;
        }
        
        console.log('Fetching adoptable animals from:', url);
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                console.error('API response not OK:', response.status, response.statusText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API response received, total records:', data.length);
            return data;
        } catch (error) {
            console.error('Error fetching adoptable animals:', error);
            throw error;
        }
    }

    thumbnailUrl(animalId) {
        if (this.#useProxy) {
            return `/api/asm/animal_thumbnail?animalid=${animalId}`;
        }
        return `${this.#base}?account=${this.#account}&method=animal_thumbnail&animalid=${animalId}&username=${this.#username}&password=${this.#password}`;
    }

    async animalViewUrl(animalId) {
        try {
            // Get all adoptable animals and find the specific one
            const animals = await this.getAdoptable();
            const animal = animals.find(a => a.ID === animalId || a.ID === parseInt(animalId));
            
            if (!animal) {
                throw new Error(`Animal with ID ${animalId} not found`);
            }
            
            // Return the animal data instead of just a URL
            return animal;
        } catch (error) {
            console.error('Error getting animal data:', error);
            throw error;
        }
    }
}