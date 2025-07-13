import { ASMService } from '../api/asmService.js';

export class DogDetailService {
    static async fetchDogDetails(dogId) {
        try {
            console.log('Fetching details for dog ID:', dogId);
            
            // Create ASMService instance - no credentials needed
            const asmService = new ASMService();
            
            // Get all adoptable animals (same as index page)
            const animals = await asmService.getAdoptable();
            console.log('All animals loaded:', animals.length);
            
            // Find the specific dog by ID
            const animal = animals.find(a => {
                const animalId = a.ANIMALID || a.animalid || a.ID || a.id;
                return animalId && (animalId === dogId || animalId === parseInt(dogId));
            });
            
            if (!animal) {
                console.error(`Animal with ID ${dogId} not found in ${animals.length} animals`);
                throw new Error(`Animal with ID ${dogId} not found`);
            }
            
            console.log('Found animal:', animal);
            
            // Transform the animal data to the expected format
            return this.transformAnimalData(animal);
            
        } catch (error) {
            console.error('Error fetching dog details, using mock data:', error);
            return this.getMockDogData(dogId);
        }
    }
    
    
    static parseDogDetails(htmlText, dogId) {
        // Create a temporary DOM element to parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        // Extract dog information
        const dogData = {
            id: dogId,
            name: this.extractName(doc),
            breed: this.extractBreed(doc),
            age: this.extractAge(doc),
            sex: this.extractSex(doc),
            size: this.extractSize(doc),
            traits: this.extractTraits(doc),
            description: this.extractDescription(doc),
            images: this.getImageUrls(dogId),
            adoptionLink: this.extractAdoptionLink(doc)
        };
        
        console.log('Parsed dog data:', dogData);
        return dogData;
    }
    
    static extractName(doc) {
        // Look for the dog name in the heading
        const heading = doc.querySelector('h2');
        if (heading) {
            const text = heading.textContent;
            // Extract name from "Ada - 2411474" format
            const namePart = text.split(' - ')[0];
            return namePart || 'Unknown';
        }
        return 'Unknown';
    }
    
    static extractBreed(doc) {
        const text = doc.body.textContent;
        const breedMatch = text.match(/Breed:\\s*([^\\n]+)/i);
        return breedMatch ? breedMatch[1].trim() : 'Mixed Breed';
    }
    
    static extractAge(doc) {
        const text = doc.body.textContent;
        const dobMatch = text.match(/Estimated Date of Birth:\\s*([^\\n.]+)/i);
        if (dobMatch) {
            const dobStr = dobMatch[1].trim();
            try {
                const dob = new Date(dobStr);
                const now = new Date();
                const ageYears = Math.floor((now - dob) / (365.25 * 24 * 60 * 60 * 1000));
                const ageMonths = Math.floor(((now - dob) % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
                
                if (ageYears > 0) {
                    return `${ageYears} year${ageYears > 1 ? 's' : ''}`;
                } else {
                    return `${ageMonths} month${ageMonths > 1 ? 's' : ''}`;
                }
            } catch (e) {
                return dobStr;
            }
        }
        
        // Try alternative format
        const ageMatch = text.match(/Age:\\s*([^\\n]+)/i);
        return ageMatch ? ageMatch[1].trim() : 'Unknown age';
    }
    
    static extractSex(doc) {
        const text = doc.body.textContent;
        const sexMatch = text.match(/Sex:\\s*(\\w+)/i);
        return sexMatch ? sexMatch[1].trim() : 'Unknown';
    }
    
    static extractSize(doc) {
        const text = doc.body.textContent;
        const sizeMatch = text.match(/Estimated Size as Adult:\\s*([^\\n.]+)/i);
        return sizeMatch ? sizeMatch[1].trim() : 'Unknown';
    }
    
    static extractTraits(doc) {
        const text = doc.body.textContent;
        const traits = [];
        
        // Look for bullet points or traits
        const traitPatterns = [
            /• Good with cats/i,
            /• Good with dogs/i,
            /• Good with children/i,
            /• Housetrained/i,
            /• Crate trained/i,
            /• Good traveller/i,
            /• Good on leash/i,
            /• Energy Level - (\\w+)/i
        ];
        
        traitPatterns.forEach(pattern => {
            const match = text.match(pattern);
            if (match) {
                if (match[1]) {
                    // Energy level special case
                    traits.push({ 
                        text: `Energy Level: ${match[1]}`, 
                        type: 'energy',
                        icon: 'fas fa-bolt'
                    });
                } else {
                    // Regular traits
                    let traitText = match[0].replace('• ', '');
                    let type = 'positive';
                    let icon = 'fas fa-check';
                    
                    if (traitText.includes('cats')) icon = 'fas fa-cat';
                    else if (traitText.includes('dogs')) icon = 'fas fa-dog';
                    else if (traitText.includes('children')) icon = 'fas fa-child';
                    else if (traitText.includes('trained')) icon = 'fas fa-graduation-cap';
                    else if (traitText.includes('leash')) icon = 'fas fa-link';
                    
                    traits.push({ 
                        text: traitText, 
                        type: type,
                        icon: icon
                    });
                }
            }
        });
        
        return traits;
    }
    
    static extractDescription(doc) {
        const text = doc.body.textContent;
        
        // Look for the main description paragraph
        // It usually starts after the traits and before the adoption info
        const paragraphs = doc.querySelectorAll('p, div');
        let description = '';
        
        for (let p of paragraphs) {
            const pText = p.textContent.trim();
            // Look for substantial paragraphs that seem like descriptions
            if (pText.length > 100 && 
                !pText.includes('Click Here For') && 
                !pText.includes('Share on') &&
                !pText.includes('Big Paws of the Ozarks') &&
                !pText.includes('• ')) {
                description = pText;
                break;
            }
        }
        
        // If no description found in paragraphs, try to extract from full text
        if (!description) {
            // Look for text between traits and adoption info
            const lines = text.split('\\n').map(line => line.trim()).filter(line => line);
            let descStart = -1;
            let descEnd = -1;
            
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('Energy Level') || lines[i].includes('Good on leash')) {
                    descStart = i + 1;
                }
                if (lines[i].includes('We require an approved') || lines[i].includes('Click Here For')) {
                    descEnd = i;
                    break;
                }
            }
            
            if (descStart > -1 && descEnd > descStart) {
                description = lines.slice(descStart, descEnd).join(' ').trim();
            }
        }
        
        return description || 'No description available.';
    }
    
    
    static extractAdoptionLink(doc) {
        // Look for adoption application link
        const links = doc.querySelectorAll('a');
        for (let link of links) {
            if (link.textContent.includes('Adoption Application') || 
                link.href.includes('online_form_html')) {
                return link.href;
            }
        }
        
        // Default adoption link
        return 'https://service.sheltermanager.com/asmservice?account=km2607&method=online_form_html&formid=21';
    }
    
    static async validateImages(imageUrls) {
        // For media_image URLs from PHOTOURLS, they should be valid
        // so we can skip validation for performance
        const validImages = [];
        
        for (let url of imageUrls) {
            // If it's a media_image URL from the API, assume it's valid
            if (url.includes('method=media_image')) {
                validImages.push(url);
            } else {
                // For other URLs, validate them
                try {
                    const response = await fetch(url, { method: 'HEAD' });
                    if (response.ok) {
                        validImages.push(url);
                    }
                } catch (error) {
                    // Skip invalid URLs
                    console.warn('Invalid image URL:', url);
                }
            }
        }
        
        return validImages.length > 0 ? validImages : imageUrls.slice(0, 1); // At least return first image
    }
    
    static async transformAnimalData(animal) {
        // Handle both uppercase and lowercase field names like in main.js
        const animalId = animal.ANIMALID || animal.animalid || animal.ID || animal.id;
        const animalName = animal.ANIMALNAME || animal.animalname || 'Unknown';
        const animalAge = animal.ANIMALAGE || animal.animalage || 'Age unknown';
        const breedName = animal.BREEDNAME || animal.breedname || 'Mixed breed';
        const sexName = animal.SEXNAME || animal.sexname || '';
        const sizeName = animal.SIZENAME || animal.sizename || 'Unknown';
        
        return {
            id: animalId,
            name: animalName,
            breed: breedName,
            age: animalAge,
            sex: sexName,
            size: sizeName,
            description: animal.WEBSITEMEDIANOTES || animal.websitemedianotes || 
                        animal.ANIMALCOMMENTS || animal.animalcomments || 
                        'No description available',
            traits: this.extractTraitsFromData(animal),
            images: await this.getAnimalImages(animal),
            location: animal.CURRENTOWNERNAME || animal.currentownername || 'Unknown',
            dateArrived: animal.DATEBROUGHTIN || animal.datebroughtin,
            microchip: animal.IDENTICHIPNUMBER || animal.identichipnumber,
            neutered: (animal.NEUTERED || animal.neutered) === 1 ? 'Yes' : 'No',
            goodWithKids: this.parseGoodWith(animal.ISGOODWITHCHILDREN || animal.isgoodwithchildren),
            goodWithDogs: this.parseGoodWith(animal.ISGOODWITHDOGS || animal.isgoodwithdogs),
            goodWithCats: this.parseGoodWith(animal.ISGOODWITHCATS || animal.isgoodwithcats),
            houseTrained: this.parseYesNo(animal.ISHOUSETRAINED || animal.ishousetrained),
            adoptionLink: `https://service.sheltermanager.com/asmservice?account=km2607&method=online_form_html&formid=21`
        };
    }
    
    static extractTraitsFromData(animal) {
        const traits = [];
        
        // Add traits based on animal properties (handle both uppercase and lowercase)
        // 0 === true, 1 === false, 2 === unknown

        // Good with kids
        const kidsVal = animal.ISGOODWITHCHILDREN ?? animal.isgoodwithchildren;
        if (kidsVal === 0) {
            traits.push({ text: 'Good with kids', type: 'positive', icon: 'fas fa-child' });
        }

        // Good with dogs
        const dogsVal = animal.ISGOODWITHDOGS ?? animal.isgoodwithdogs;
        if (dogsVal === 0) {
            traits.push({ text: 'Good with dogs', type: 'positive', icon: 'fas fa-dog' });
        }

        // Good with cats
        const catsVal = animal.ISGOODWITHCATS ?? animal.isgoodwithcats;
        if (catsVal === 0) {
            traits.push({ text: 'Good with cats', type: 'positive', icon: 'fas fa-cat' });
        }

        // House trained
        const houseVal = animal.ISHOUSETRAINED ?? animal.ishousetrained;
        if (houseVal === 0) {
            traits.push({ text: 'House trained', type: 'positive', icon: 'fas fa-home' });
        }

        // Spayed/Neutered
        const neuteredVal = animal.NEUTEREDNAME;
        if (neuteredVal === 'Yes') {
            traits.push({ text: 'Spayed/Neutered', type: 'positive', icon: 'fas fa-check' });
        }
        
        // Add additional traits from comments or notes
        const description = (animal.WEBSITEMEDIANOTES || animal.websitemedianotes || 
                           animal.ANIMALCOMMENTS || animal.animalcomments || '').toLowerCase();
        
        if (description.includes('friendly')) {
            traits.push({ text: 'Friendly', type: 'positive', icon: 'fas fa-heart' });
        }
        if (description.includes('calm') || description.includes('gentle')) {
            traits.push({ text: 'Calm', type: 'positive', icon: 'fas fa-dove' });
        }
        if (description.includes('playful')) {
            traits.push({ text: 'Playful', type: 'positive', icon: 'fas fa-ball' });
        }

        // Energy level
        const energyLevel = animal.ENERGYLEVEL || animal.energylevel;
        if (energyLevel) {
           switch (energyLevel) {
                case 1:
                    traits.push({ text: 'Very Low Energy', type: 'neutral', icon: 'fas fa-bed' });
                    break;
                case 2:
                    traits.push({ text: 'Low Energy', type: 'neutral', icon: 'fas fa-leaf' });
                    break;
                case 3:
                    traits.push({ text: 'Medium Energy', type: 'neutral', icon: 'fas fa-walking' });
                    break;
                case 4:
                    traits.push({ text: 'High Energy', type: 'neutral', icon: 'fas fa-bolt' });
                    break;
                case 5:
                    traits.push({ text: 'Very High Energy', type: 'neutral', icon: 'fas fa-running' });
                    break;
            }
        }
        
        return traits;
    }
    
    static async getAnimalImages(animal) {
        const images = [];
        
        // Check if PHOTOURLS exists and has images
        const photoUrls = animal.PHOTOURLS || animal.photourls;
        
        if (photoUrls && Array.isArray(photoUrls) && photoUrls.length > 0) {
            // Use the actual photo URLs from the API response
            images.push(...photoUrls);
        } else {
            // Fallback to creating image URLs if no photos available
            const animalId = animal.ANIMALID || animal.animalid || animal.ID || animal.id;
            const asmService = new ASMService();
            // Try to get at least 3 images
            for (let i = 1; i <= 3; i++) {
                images.push(asmService.imageUrl(animalId, i));
            }
        }
        
        return images;
    }
    
    static parseGoodWith(value) {
        if (value === 1) return 'Yes';
        if (value === 0) return 'No';
        return 'Unknown';
    }
    
    static parseYesNo(value) {
        return value === 1 ? 'Yes' : 'No';
    }
    
    static getMockDogData(dogId) {
        // Provide realistic mock data for testing when ASM API is unavailable
        const mockDogs = {
            'A001542': {
                id: 'A001542',
                name: 'Buddy',
                breed: 'Golden Retriever Mix',
                age: '3 years',
                sex: 'Male',
                size: 'Large',
                description: 'Buddy is a wonderful, energetic dog who loves to play fetch and go on long walks. He\'s great with kids and other dogs, making him the perfect family companion. Buddy is house trained and knows basic commands. He would do best in a home with a fenced yard where he can run and play.',
                traits: [
                    { text: 'Good with kids', type: 'positive' },
                    { text: 'Good with dogs', type: 'positive' },
                    { text: 'House trained', type: 'positive' },
                    { text: 'Energetic', type: 'neutral' },
                    { text: 'Friendly', type: 'positive' },
                    { text: 'Spayed/Neutered', type: 'positive' }
                ],
                images: [
                    'https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=500&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=500&h=400&fit=crop'
                ],
                location: 'Main Shelter',
                dateArrived: '2024-01-15',
                microchip: 'MC123456789',
                neutered: 'Yes',
                goodWithKids: 'Yes',
                goodWithDogs: 'Yes',
                goodWithCats: 'Unknown',
                houseTrained: 'Yes',
                adoptionLink: '#'
            },
            'default': {
                id: dogId,
                name: 'Mystery Pup',
                breed: 'Mixed Breed',
                age: 'Young',
                sex: 'Unknown',
                size: 'Medium',
                description: 'This adorable pup is looking for their forever home! Contact us to learn more about this special dog.',
                traits: [
                    { text: 'Friendly', type: 'positive' },
                    { text: 'Loving', type: 'positive' }
                ],
                images: [
                    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=500&h=400&fit=crop'
                ],
                location: 'Main Shelter',
                dateArrived: '2024-01-01',
                microchip: 'Unknown',
                neutered: 'Unknown',
                goodWithKids: 'Unknown',
                goodWithDogs: 'Unknown',
                goodWithCats: 'Unknown',
                houseTrained: 'Unknown',
                adoptionLink: '#'
            }
        };
        
        return mockDogs[dogId] || mockDogs['default'];
    }
}
