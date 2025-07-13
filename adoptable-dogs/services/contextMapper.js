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

            const energyLevel = dog.ENERGYLEVEL || dog.energylevel || '';
            
            // Additional useful fields
            const sex = dog.SEXNAME || dog.sexname || '';
            const size = dog.SIZE || dog.size || '';
            const goodWith = this.extractCompatibility(dog);
            
            // Format: ID|NAME|BREED|AGE|SEX|SIZE|ENERGYLEVEL|GOOD_WITH|DESCRIPTION
            return `${id}|${name}|${breed}|${age}|${sex}|${size}|${energyLevel}|${goodWith}|${description}`;
        }).join('\n');
    }
    
    static extractCompatibility(dog) {
        const compatibility = [];

        // Helper to map value to string
        const mapValue = (value, item) => {
            if (value === 0 || value === '0') return `Good with ${item}`;
            if (value === 1 || value === '1') return `Bad with ${item}`;
            if (value === 2 || value === '2') return `Not tested with ${item}`;
            return null;
        };

        // Check various compatibility fields
        const cats = mapValue(dog.ISGOODWITHCATS ?? dog.isgoodwithcats, 'cats');
        const dogs = mapValue(dog.ISGOODWITHDOGS ?? dog.isgoodwithdogs, 'dogs');
        const kids = mapValue(dog.ISGOODWITHCHILDREN ?? dog.isgoodwithchildren, 'kids');

        [cats, dogs, kids].forEach(result => {
            if (result) compatibility.push(result);
        });

        return compatibility.length > 0 ? compatibility.join(', ') : 'unknown';
    }
    
    static getContextSize(context) {
        // Rough estimate of token count (1 token ≈ 4 characters)
        return Math.ceil(context.length / 4);
    }
}