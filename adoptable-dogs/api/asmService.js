export class ASMService {
    constructor() {
        // No credentials needed - all authentication handled server-side
        console.log('ASMService initialized with secure proxy endpoints');
    }

    async getAdoptable() {
        const url = '/api/asm/json_adoptable_animals';
        console.log('Fetching adoptable animals from proxy:', url);
        
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

    // Deprecated - use PHOTOURLS[0] instead for better quality images
    thumbnailUrl(animalId) {
        // Use secure proxy endpoint that doesn't expose credentials
        return `/api/animal-thumbnail/${animalId}`;
    }

    imageUrl(animalId, seq = 1) {
        // Use secure proxy endpoint that doesn't expose credentials
        return `/api/animal-image/${animalId}/${seq}`;
    }

    async animalViewUrl(animalId) {
        try {
            // Get all adoptable animals and find the specific one
            const animals = await this.getAdoptable();
            const animal = animals.find(a => {
                const id = a.ANIMALID || a.animalid || a.ID || a.id;
                return id && (id === animalId || id === parseInt(animalId));
            });
            
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