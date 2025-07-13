export class ContextMapper {
    static MAX_DESCRIPTION_LENGTH = 150;
    
    static mapAnimalsToContext(animals) {
        // Filter to dogs only and map to compact format
        const dogs = animals.filter(animal => {
            const speciesName = animal.SPECIESNAME || animal.speciesname;
            return speciesName && speciesName.toLowerCase() === 'dog';
        });
        
        return dogs.map(dog => {
            // Extract fields with fallbacks for different casing
            const id = dog.ANIMALID || dog.animalid || dog.ID || dog.id;
            const name = dog.ANIMALNAME || dog.animalname || 'Unknown';
            const breed = dog.BREEDNAME || dog.breedname || dog.PRIMARYBREEDNAME || dog.primarybreedname || 'Mixed';
            const age = dog.ANIMALAGE || dog.animalage || dog.AGEGROUP || dog.agegroup || 'Unknown age';
            
            // Get description and truncate if needed
            let description = dog.WEBSITEMEDIANOTES || dog.ANIMALCOMMENTS || dog.DESCRIPTION || dog.description || 
                            dog.WEBSITEMEDIADESCRIPTION || dog.websitemediadescription || 
                            'No description available';
            
            // Clean up description - remove HTML tags if any
            description = description.replace(/<[^>]*>/g, '').trim();
            
            // Truncate description to keep context size manageable
            if (description.length > this.MAX_DESCRIPTION_LENGTH) {
                description = description.substring(0, this.MAX_DESCRIPTION_LENGTH) + '...';
            }
            
            // Additional useful fields
            const sex = dog.SEXNAME || dog.sexname || '';
            const size = dog.SIZE || dog.size || '';
            const goodWith = this.extractCompatibility(dog);
            
            // Format: ID|NAME|BREED|AGE|SEX|SIZE|GOOD_WITH|DESCRIPTION
            return `${id}|${name}|${breed}|${age}|${sex}|${size}|${goodWith}|${description}`;
        }).join('\n');
    }
    
    static extractCompatibility(dog) {
        const compatibility = [];

        // Check various compatibility fields
        if (dog.ISGOODWITHCATS || dog.isgoodwithcats === 1 || dog.isgoodwithcats === 'Yes') {
            compatibility.push('cats');
        }
        if (dog.ISGOODWITHDOGS || dog.isgoodwithdogs === 1 || dog.isgoodwithdogs === 'Yes') {
            compatibility.push('dogs');
        }
        if (dog.ISGOODWITHCHILDREN || dog.isgoodwithchildren === 1 || dog.isgoodwithchildren === 'Yes') {
            compatibility.push('kids');
        }

        if (compatibility.length > 0) {
            // Join as: Good with cats, Good with dogs, ...
            return compatibility.map(item => `Good with ${item}`).join(', ');
        } else {
            return 'unknown';
        }
    }
    
    static getContextSize(context) {
        // Rough estimate of token count (1 token ≈ 4 characters)
        return Math.ceil(context.length / 4);
    }
}