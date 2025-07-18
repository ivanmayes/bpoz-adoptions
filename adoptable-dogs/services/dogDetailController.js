import { DogDetailService } from './dogDetailService.js';

export class DogDetailController {
    constructor(dogId) {
        this.dogId = dogId;
        this.dogData = null;
        this.currentImageIndex = 0;
        this.validImages = [];
    }
    
    async initialize() {
        try {
            await this.loadDogData();
            this.setupEventListeners();
            await this.loadImages();
        } catch (error) {
            console.error('Failed to initialize dog detail view:', error);
            this.showError('Failed to load dog details. Please try again.');
        }
    }
    
    async loadDogData() {
        try {
            this.dogData = await DogDetailService.fetchDogDetails(this.dogId);
            this.populateBasicInfo();
            this.populateTraits();
            this.populateDescription();
            this.setupAdoptionLinks();
        } catch (error) {
            console.error('Error loading dog data:', error);
            throw error;
        }
    }
    
    populateBasicInfo() {
        // Update page title and header
        document.title = `${this.dogData.name} - Dog Details`;
        document.getElementById('dogName').textContent = this.dogData.name;
        document.getElementById('dogNameBreadcrumb').textContent = this.dogData.name;

        // Update quick stats
        document.getElementById('dogAge').textContent = this.dogData.age;
        document.getElementById('dogBreed').textContent = this.dogData.breed;
        document.getElementById('dogSize').textContent = this.dogData.size;
        document.getElementById('dogSex').textContent = this.dogData.sex;
    }
    
    populateTraits() {
        const traitContainer = document.getElementById('traitBadges');
        traitContainer.innerHTML = '';
        
        this.dogData.traits.forEach(trait => {
            const badge = document.createElement('div');
            badge.className = `trait-badge ${trait.type}`;
            badge.innerHTML = `
                <i class="${trait.icon}"></i>
                ${trait.text}
            `;
            traitContainer.appendChild(badge);
        });
        
        // Add a default message if no traits
        if (this.dogData.traits.length === 0) {
            traitContainer.innerHTML = '<div class="trait-badge">Personality information not available</div>';
        }
    }
    
    populateDescription() {
        const descElement = document.getElementById('dogDescription');
        descElement.textContent = this.dogData.description;
    }
    
    setupAdoptionLinks() {
        const adoptionLink = document.getElementById('adoptionLink');
        adoptionLink.href = this.dogData.adoptionLink;
        
        const shareButton = document.getElementById('shareButton');
        shareButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.shareDog();
        });
    }
    
    async loadImages() {
        try {
            // Validate which images actually exist
            this.validImages = await DogDetailService.validateImages(this.dogData.images);
            
            if (this.validImages.length > 0) {
                this.setupImageCarousel();
                this.hideImageLoading();
            } else {
                this.showImageError();
            }
        } catch (error) {
            console.error('Error loading images:', error);
            this.showImageError();
        }
    }
    
    setupImageCarousel() {
        const mainImage = document.getElementById('mainImage');
        const thumbnailGrid = document.getElementById('thumbnailGrid');
        const prevBtn = document.getElementById('prevImageBtn');
        const nextBtn = document.getElementById('nextImageBtn');
        
        // Set first image as main
        mainImage.src = this.validImages[0];
        mainImage.alt = `${this.dogData.name} - Photo 1`;
        
        // Show/hide arrows based on image count
        if (this.validImages.length <= 1) {
            prevBtn.classList.add('hidden');
            nextBtn.classList.add('hidden');
        } else {
            prevBtn.classList.remove('hidden');
            nextBtn.classList.remove('hidden');
        }
        
        // Update arrow states
        this.updateArrowStates();
        
        // Create thumbnails
        thumbnailGrid.innerHTML = '';
        this.validImages.forEach((imageUrl, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = imageUrl;
            thumbnail.alt = `${this.dogData.name} - Thumbnail ${index + 1}`;
            thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.addEventListener('click', () => this.selectImage(index));
            thumbnailGrid.appendChild(thumbnail);
        });
        
        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.navigateImage(-1);
            } else if (e.key === 'ArrowRight') {
                this.navigateImage(1);
            }
        });
    }
    
    selectImage(index) {
        if (index < 0 || index >= this.validImages.length) return;
        
        this.currentImageIndex = index;
        
        // Update main image
        const mainImage = document.getElementById('mainImage');
        mainImage.src = this.validImages[index];
        mainImage.alt = `${this.dogData.name} - Photo ${index + 1}`;
        
        // Update thumbnail active state
        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
        
        // Update arrow states
        this.updateArrowStates();
    }
    
    navigateImage(direction) {
        let newIndex = this.currentImageIndex + direction;
        
        // Handle continuous loop
        if (newIndex >= this.validImages.length) {
            newIndex = 0; // Go to first image when reaching the end
        } else if (newIndex < 0) {
            newIndex = this.validImages.length - 1; // Go to last image when going before the first
        }
        
        this.selectImage(newIndex);
    }
    
    updateArrowStates() {
        const prevBtn = document.getElementById('prevImageBtn');
        const nextBtn = document.getElementById('nextImageBtn');
        
        // With continuous looping, arrows are never disabled
        // Only update if arrows are visible (more than one image)
        if (!prevBtn.classList.contains('hidden')) {
            prevBtn.disabled = false;
            nextBtn.disabled = false;
        }
    }
    
    hideImageLoading() {
        document.getElementById('imageLoading').style.display = 'none';
        document.getElementById('imageCarousel').style.display = 'block';
    }
    
    showImageError() {
        const loadingElement = document.getElementById('imageLoading');
        loadingElement.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            No images available for this dog
        `;
        loadingElement.style.color = '#B01302';
    }
    
    setupEventListeners() {
        // Back to list button
        document.getElementById('backToList').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'index.html';
        });
        
        // Share button
        document.getElementById('shareButton').addEventListener('click', (e) => {
            e.preventDefault();
            this.shareDog();
        });
        
        // Carousel arrow event listeners
        document.getElementById('prevImageBtn').addEventListener('click', () => {
            this.navigateImage(-1);
        });
        
        document.getElementById('nextImageBtn').addEventListener('click', () => {
            this.navigateImage(1);
        });
    }
    
    goBack() {
        // Check if there's history to go back to
        if (document.referrer && document.referrer.includes(window.location.origin)) {
            window.history.back();
        } else {
            // Default to main dogs page
            window.location.href = 'index.html';
        }
    }
    
    shareDog() {
        if (navigator.share) {
            // Use native sharing if available
            navigator.share({
                title: `Meet ${this.dogData.name}`,
                text: `Check out ${this.dogData.name}, a ${this.dogData.breed} looking for a forever home!`,
                url: window.location.href
            }).catch(err => {
                console.log('Error sharing:', err);
                this.fallbackShare();
            });
        } else {
            this.fallbackShare();
        }
    }
    
    fallbackShare() {
        // Get the current page URL
        const currentUrl = window.location.href;
        
        // Try modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(currentUrl).then(() => {
                this.showShareSuccess();
            }).catch(err => {
                console.error('Clipboard API failed:', err);
                this.fallbackCopyMethod(currentUrl);
            });
        } else {
            // Fallback to older method
            this.fallbackCopyMethod(currentUrl);
        }
    }
    
    fallbackCopyMethod(url) {
        try {
            // Create a temporary input element
            const tempInput = document.createElement('input');
            tempInput.style.position = 'absolute';
            tempInput.style.left = '-9999px';
            tempInput.value = url;
            document.body.appendChild(tempInput);
            
            // Select and copy the text
            tempInput.select();
            tempInput.setSelectionRange(0, 99999); // For mobile devices
            
            const successful = document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            if (successful) {
                this.showShareSuccess();
            } else {
                this.showShareError();
            }
        } catch (err) {
            console.error('Fallback copy method failed:', err);
            this.showShareError();
        }
    }
    
    showShareSuccess() {
        const shareButton = document.getElementById('shareButton');
        const originalText = shareButton.innerHTML;
        shareButton.innerHTML = '<i class="fas fa-check"></i> Link Copied!';
        shareButton.style.background = '#b2b333';
        shareButton.style.color = 'white';
        shareButton.style.borderColor = '#b2b333';
        
        setTimeout(() => {
            shareButton.innerHTML = originalText;
            shareButton.style.background = '';
            shareButton.style.color = '';
            shareButton.style.borderColor = '';
        }, 2000);
    }
    
    showShareError() {
        const shareButton = document.getElementById('shareButton');
        const originalText = shareButton.innerHTML;
        shareButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Copy Failed';
        shareButton.style.background = '#B01302';
        shareButton.style.color = 'white';
        shareButton.style.borderColor = '#B01302';
        
        setTimeout(() => {
            shareButton.innerHTML = originalText;
            shareButton.style.background = '';
            shareButton.style.color = '';
            shareButton.style.borderColor = '';
        }, 3000);
        
        // Show manual copy option
        const currentUrl = window.location.href;
        const message = `Could not copy link automatically. Please copy this URL manually:\n\n${currentUrl}`;
        alert(message);
    }
    
    showError(message) {
        const container = document.querySelector('.dog-detail-container');
        container.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Error</h4>
                <p>${message}</p>
                <hr>
                <p class="mb-0">
                    <a href="index.html" class="btn btn-primary">
                        <i class="fas fa-arrow-left"></i> Return to Dog List
                    </a>
                </p>
            </div>
        `;
    }
}
