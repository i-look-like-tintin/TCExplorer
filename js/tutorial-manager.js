class TutorialManager {
    constructor(app) {
        this.app = app;
        this.currentStep = 0;
        this.isActive = false;
        this.tutorialData = null;
        this.overlay = null;
        this.spotlight = null;

        // Tutorial version for updates
        this.tutorialVersion = '1.1';

        this.initializeTutorialData();
    }

    initializeTutorialData() {
        // Desktop tutorial steps
        this.desktopTutorial = [
            {
                id: 'welcome',
                title: 'Welcome to Tropical Cyclone Track Visualization',
                content: `This tool helps you explore how tropical cyclones (hurricanes) around Australia have changed over time and may change in the future due to climate change.

<strong>What you'll learn:</strong>
<ul>
<li>How to view storm tracks on the map</li>
<li>Compare different climate scenarios</li>
<li>Filter data by time periods and intensity</li>
</ul>`,
                highlight: null,
                position: 'center',
                showSkip: true,
                preventBackdropClose: true
            },
            {
                id: 'map-basics',
                title: 'Exploring the Map',
                content: `The map shows tropical cyclone tracks around Australia.

<strong>Navigation:</strong>
<ul>
<li><strong>Drag</strong> to move around the map</li>
<li><strong>Scroll</strong> to zoom in/out</li>
<li><strong>Click</strong> on any track to see cyclone details</li>
</ul>

<strong>Colors show storm intensity:</strong>
<ul>
<li>Blue = Category 1 (weakest)</li>
<li>Red/Purple = Category 4-5 (strongest)</li>
</ul>`,
                highlight: '#map',
                position: 'left',
                showSkip: true,
                preventBackdropClose: true
            },
            {
                id: 'map-toggle',
                title: 'Switch Map Views',
                content: `Click this button to switch between street map and satellite imagery!

<ul>
<li><strong>Street Map:</strong> Standard map view with roads and labels</li>
<li><strong>Satellite:</strong> High-resolution satellite imagery view</li>
</ul>

<p>Your preference will be saved for future visits.</p>

<em>Try clicking the button to switch between views!</em>`,
                highlight: '.map-toggle-control',
                position: 'dynamic',
                showSkip: true,
                allowInteraction: true
            },
            {
                id: 'scenarios',
                title: 'Climate Scenarios Explained',
                content: `Choose different climate scenarios to see how storms change:

<ul>
<li><strong>Historical (1951-2011):</strong> Simulated past storms without the impact of global temperature change</li>
<li><strong>Natural Climate:</strong> Storms with a natural temperature change</li>
<li><strong>+2K Warming:</strong> Projected storms with 2° Kelvin temperature rise</li>
<li><strong>+4K Warming:</strong> Projected storms with 4° Kelvin temperature rise</li>
</ul>

<em>Try changing the scenario dropdown to see different data!</em>`,
                highlight: '#scenario-select',
                position: 'right',
                showSkip: true,
                allowInteraction: true
            },
            {
                id: 'comparison-mode',
                title: 'Compare Two Scenarios',
                content: `Toggle "Comparison Mode" to see two scenarios side-by-side.

<ul>
<li><strong>Blue tracks:</strong> Scenario A</li>
<li><strong>Red tracks:</strong> Scenario B</li>
</ul>

<p>This is perfect for comparing historical storms with future projections!</p>

<em>Try enabling comparison mode by clicking the checkbox!</em>`,
                highlight: '.comparison-toggle',
                position: 'below',
                showSkip: true,
                allowInteraction: true
            },
            {
                id: 'year-filtering',
                title: 'Filter by Time Period',
                content: `Use the year sliders to focus on specific time periods.

<ul>
<li><strong>In regular mode:</strong> Single year range</li>
<li><strong>In comparison mode:</strong> Separate ranges for each scenario</li>
</ul>

<p>This helps you analyze trends over specific decades.</p>

<em>Try dragging the year sliders to change the time range!</em>`,
                highlight: '#single-mode-controls .year-range-container',
                position: 'dynamic',
                showSkip: true,
                allowInteraction: true
            },
            {
                id: 'display-options',
                title: 'Customize Your View',
                content: `Control what appears on the map:

<ul>
<li><strong>Show Tracks:</strong> Storm paths (lines)</li>
<li><strong>Show Genesis Points:</strong> Where storms begin (red dots)</li>
<li><strong>Show Intensity Colours:</strong> Color-coded by strength</li>
<li><strong>Show Heatmap:</strong> Density visualization</li>
<li><strong>Show Pre-Category 1:</strong> Include weaker storms</li>
</ul>

<p><strong>Tip:</strong> This area is scrollable! Look for "Scroll for more" when there are additional options.</p>

<em>Try checking/unchecking these options to see changes!</em>`,
                highlight: '.toggle-options',
                position: 'right',
                showSkip: true,
                allowInteraction: true
            },
            {
                id: 'colorblind-mode',
                title: 'Accessibility: Colorblind Mode',
                content: `Enable colorblind-friendly colors for better accessibility!

<strong>What changes:</strong>
<ul>
<li><strong>Storm Tracks:</strong> Uses scientifically-validated color palette</li>
<li><strong>Comparison Mode:</strong> Blue vs Orange (instead of Blue vs Red)</li>
<li><strong>Heatmaps:</strong> Blue-Purple-Yellow gradient</li>
<li><strong>Legend:</strong> Updates to show accessible colors</li>
</ul>

<p><strong>Scroll down</strong> in Display Options to find the "Colorblind Mode" checkbox!</p>

<em>Try toggling it to see the difference!</em>`,
                highlight: '.toggle-options',
                position: 'dynamic',
                showSkip: true,
                allowInteraction: true
            },
            {
                id: 'export-data',
                title: 'Export Your Data',
                content: `Download the currently displayed data as a CSV file for further analysis in spreadsheets or other tools.

The export includes all visible cyclone tracks with their details like intensity, location, and timing.`,
                highlight: '#export-data',
                position: 'dynamic',
                showSkip: true,
                preventBackdropClose: true
            },
            {
                id: 'complete',
                title: 'Tutorial Complete!',
                content: `You're ready to explore tropical cyclone data!

<strong>Quick tips:</strong>
<ul>
<li>Start with comparing Historical vs +2K Warming scenarios</li>
<li>Use year filters to focus on recent decades</li>
<li>Click on tracks to see individual storm details</li>
<li>The legend shows intensity categories</li>
</ul>

<p>You can restart this tutorial anytime from the header menu.</p>`,
                highlight: null,
                position: 'center',
                showSkip: false,
                preventBackdropClose: true
            }
        ];

        // Mobile tutorial steps
        this.mobileTutorial = [
            {
                id: 'welcome-mobile',
                title: 'Track Tropical Cyclones',
                content: `Welcome! This mobile-friendly view lets you explore tropical cyclone tracks around Australia.

<strong>What are tropical cyclones?</strong>
Large rotating storms (also called hurricanes or typhoons) that form over warm ocean water.`,
                highlight: null,
                position: 'center',
                showSkip: true,
                preventBackdropClose: true,
                fabAccessible: false
            },
            {
                id: 'map-navigation',
                title: 'Navigate the Map',
                content: `<strong>Touch controls:</strong>
<ul>
<li><strong>Pinch</strong> to zoom in/out</li>
<li><strong>Drag</strong> to move around</li>
<li><strong>Tap</strong> any storm track for details</li>
</ul>

<p>The colored lines show different storm intensities - blue for weaker storms, red for the strongest.</p>`,
                highlight: '#map',
                position: 'center',
                showSkip: true,
                preventBackdropClose: true,
                fabAccessible: false
            },
            {
                id: 'map-toggle-mobile',
                title: 'Switch Map Views',
                content: `Tap the button at the top-left of the map to switch between:

<ul>
<li><strong>Street Map:</strong> Shows roads and labels</li>
<li><strong>Satellite:</strong> Real satellite imagery</li>
</ul>

<p>Your preference is saved automatically!</p>`,
                highlight: '.map-toggle-control',
                position: 'center',
                showSkip: true,
                allowInteraction: true,
                fabAccessible: false
            },
            {
                id: 'menu-button',
                title: 'Access Controls',
                content: `Tap this blue menu button (☰) to access all controls and settings.

On mobile, we keep the map clear by hiding controls in this menu.

<em>Try tapping the menu button now!</em>`,
                highlight: '#simple-mobile-fab',
                position: 'above',
                pulse: true,
                showSkip: true,
                allowInteraction: true,
                fabAccessible: true,
                preventBackdropClose: true
            },
            {
                id: 'mobile-controls',
                title: 'Essential Controls',
                content: `Great! Now you can see the control menu. Here you can:

<strong>Change Climate Scenarios:</strong>
<ul>
<li>Historical data vs future projections</li>
<li>See how storms may change with warming</li>
</ul>

<strong>Filter by Years:</strong>
<ul>
<li>Focus on specific time periods</li>
<li>Compare different decades</li>
</ul>

<strong>Display Options:</strong>
<ul>
<li>Some sections in this menu are scrollable</li>
<li>Look for "Scroll for more" text when available</li>
</ul>

<p><em>Try changing scenarios or adjusting the year range!</em></p>`,
                highlight: '#mobile-controls-wrapper',
                position: 'center',
                requiresMenuOpen: true,
                showSkip: true,
                allowInteraction: true,
                fabAccessible: true,
                preventBackdropClose: true,
                makeChildrenInteractive: true
            },
            {
                id: 'colorblind-mobile',
                title: 'Colorblind Accessibility',
                content: `In the Display Options (scroll down), you'll find "Colorblind Mode"!

<strong>Enables:</strong>
<ul>
<li>Colorblind-safe color palettes</li>
<li>Blue vs Orange for comparisons</li>
<li>Accessible heatmap colors</li>
</ul>

<p>Perfect for users with color vision deficiencies!</p>

<em>Scroll down in the menu to find it!</em>`,
                highlight: '#mobile-controls-wrapper',
                position: 'center',
                requiresMenuOpen: true,
                showSkip: true,
                allowInteraction: true,
                fabAccessible: true,
                preventBackdropClose: true,
                makeChildrenInteractive: true
            },
            {
                id: 'comparison-mobile',
                title: 'Compare Scenarios',
                content: `Enable "Comparison Mode" to see two climate scenarios at once:

<ul>
<li><strong>Blue tracks:</strong> First scenario</li>
<li><strong>Red tracks:</strong> Second scenario</li>
</ul>

<p><em>Try toggling comparison mode!</em></p>
<p><em>Tip:</em> Comparison mode works best in landscape orientation!</p>`,
                highlight: '.comparison-toggle',
                position: 'center',
                requiresMenuOpen: true,
                showSkip: true,
                allowInteraction: true,
                fabAccessible: true,
                preventBackdropClose: true,
                makeChildrenInteractive: true
            },
            {
                id: 'complete-mobile',
                title: 'Ready to Explore!',
                content: `You're all set to explore cyclone data on mobile!

<strong>Pro tips:</strong>
<ul>
<li>Rotate to landscape for comparison mode</li>
<li>Tap the menu button anytime for controls</li>
<li>Tap storm tracks to learn about specific cyclones</li>
</ul>

<p>Enjoy exploring how storms around Australia are changing!</p>`,
                highlight: null,
                position: 'center',
                showSkip: false,
                preventBackdropClose: true,
                fabAccessible: false
            }
        ];
    }

    async checkAndStartTutorial() {
        const hasCompletedTutorial = localStorage.getItem('tc-tutorial-completed');
        const tutorialVersion = localStorage.getItem('tc-tutorial-version');

        // Check for URL parameter to force tutorial
        const urlParams = new URLSearchParams(window.location.search);
        const forceTutorial = urlParams.get('tutorial') === 'true';

        // Start tutorial if never completed, version updated, or forced via URL
        if (!hasCompletedTutorial || tutorialVersion !== this.tutorialVersion || forceTutorial) {
            // Give the app a moment to fully initialize
            setTimeout(() => {
                this.startTutorial();
            }, 1000);
        }
    }

    startTutorial() {
        if (this.isActive) return;

        this.isActive = true;
        this.currentStep = 0;

        // Force portrait orientation and add tutorial lock
        this.forcePortraitOrientation();
        document.body.classList.add('tutorial-active');

        // Determine which tutorial to use
        const isMobile = this.app.deviceManager && this.app.deviceManager.isMobile();
        this.tutorialData = isMobile ? this.mobileTutorial : this.desktopTutorial;

        this.createTutorialOverlay();
        this.showStep(0);
    }

    createTutorialOverlay() {
        // Remove existing overlay if present
        if (this.overlay) {
            this.overlay.remove();
        }

        this.overlay = document.createElement('div');
        this.overlay.id = 'tutorial-overlay';
        this.overlay.innerHTML = `
            <div class="tutorial-backdrop"></div>
            <div class="tutorial-tooltip">
                <div class="tutorial-header">
                    <div class="tutorial-step-info">
                        <span class="tutorial-step-number">Step 1 of ${this.tutorialData.length}</span>
                    </div>
                    <button class="tutorial-skip" aria-label="Skip tutorial">Skip Tutorial</button>
                </div>
                <div class="tutorial-content">
                    <h3 class="tutorial-title"></h3>
                    <div class="tutorial-text"></div>
                </div>
                <div class="tutorial-navigation">
                    <button class="tutorial-prev" disabled>Previous</button>
                    <button class="tutorial-next">Next</button>
                </div>
                <div class="tutorial-progress">
                    ${this.tutorialData.map((_, index) =>
                        `<span class="progress-dot ${index === 0 ? 'active' : ''}" data-step="${index}"></span>`
                    ).join('')}
                </div>
            </div>
            <div class="tutorial-spotlight"></div>
        `;

        document.body.appendChild(this.overlay);
        this.setupEventListeners();
    }

    setupEventListeners() {
        const skipBtn = this.overlay.querySelector('.tutorial-skip');
        const prevBtn = this.overlay.querySelector('.tutorial-prev');
        const nextBtn = this.overlay.querySelector('.tutorial-next');
        const progressDots = this.overlay.querySelectorAll('.progress-dot');

        skipBtn.addEventListener('click', () => this.skipTutorial());
        prevBtn.addEventListener('click', () => this.previousStep());
        nextBtn.addEventListener('click', () => this.nextStep());

        // Progress dot navigation
        progressDots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.showStep(index));
        });

        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyPress.bind(this));

        // Close on backdrop click (with restrictions)
        this.overlay.querySelector('.tutorial-backdrop').addEventListener('click', (e) => {
            const currentStep = this.tutorialData[this.currentStep];

            // Don't close if step prevents backdrop closure
            if (currentStep.preventBackdropClose) {
                return;
            }

            // Don't close if clicking on an interactive highlighted element
            if (!e.target.closest('.tutorial-highlighted.interactive')) {
                this.skipTutorial();
            }
        });
    }

    handleKeyPress(event) {
        if (!this.isActive) return;

        switch (event.key) {
            case 'Escape':
                this.skipTutorial();
                break;
            case 'ArrowLeft':
                if (this.currentStep > 0) this.previousStep();
                break;
            case 'ArrowRight':
                this.nextStep();
                break;
        }
    }

    async showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.tutorialData.length) return;

        this.currentStep = stepIndex;
        const step = this.tutorialData[stepIndex];

        // Handle special requirements
        if (step.requiresMenuOpen) {
            await this.ensureMobileMenuOpen();
            // Extra delay to ensure menu is fully rendered before highlighting
            await new Promise(resolve => setTimeout(resolve, 100));
        } else if (step.id === 'menu-button') {
            // For the menu button step, ensure menu is closed so user can interact with it
            await this.ensureMobileMenuClosed();
        }

        this.updateTutorialContent(step);
        this.updateHighlight(step);
        this.updateNavigation();
        this.updateProgress();
        this.positionTooltip(step);
    }

    async ensureMobileMenuOpen() {
        const fab = document.getElementById('simple-mobile-fab');
        const panel = document.getElementById('mobile-controls-wrapper');

        if (fab && panel) {
            // Check if menu is closed
            if (panel.style.transform !== 'translateY(0px)' && !panel.classList.contains('show')) {
                fab.click();
                // Wait for animation
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
    }

    async ensureMobileMenuClosed() {
        const fab = document.getElementById('simple-mobile-fab');
        const panel = document.getElementById('mobile-controls-wrapper');

        if (fab && panel) {
            // Check if menu is open
            if (panel.style.transform === 'translateY(0px)' || panel.classList.contains('show')) {
                fab.click();
                // Wait for animation
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
    }

    updateTutorialContent(step) {
        const title = this.overlay.querySelector('.tutorial-title');
        const text = this.overlay.querySelector('.tutorial-text');
        const stepNumber = this.overlay.querySelector('.tutorial-step-number');
        const skipBtn = this.overlay.querySelector('.tutorial-skip');

        title.textContent = step.title;

        // Handle dynamic content based on app state
        let content = step.content;
        if (step.id === 'year-filtering' && this.app.comparisonMode) {
            content = `Use the year sliders to focus on specific time periods for each scenario.

<ul>
<li><strong>Scenario A:</strong> Blue year range controls</li>
<li><strong>Scenario B:</strong> Red year range controls</li>
<li><strong>Independent ranges:</strong> Each scenario can have different time periods</li>
</ul>

<p>This helps you compare how different decades show varying storm patterns.</p>

<em>Try dragging the year sliders for each scenario!</em>`;
        }

        text.innerHTML = content;
        stepNumber.textContent = `Step ${this.currentStep + 1} of ${this.tutorialData.length}`;

        // Show/hide skip button based on step
        skipBtn.style.display = step.showSkip ? 'block' : 'none';
    }

    updateHighlight(step) {
        // Remove existing highlights
        document.querySelectorAll('.tutorial-highlighted').forEach(el => {
            el.classList.remove('tutorial-highlighted', 'interactive');
        });

        const spotlight = this.overlay.querySelector('.tutorial-spotlight');
        const backdrop = this.overlay.querySelector('.tutorial-backdrop');

        // Update backdrop cursor based on whether it can close the tutorial
        if (step.preventBackdropClose) {
            backdrop.classList.add('no-close');
        } else {
            backdrop.classList.remove('no-close');
        }

        if (step.highlight) {
            let element = document.querySelector(step.highlight);

            // Special handling for year range step - use comparison year ranges if in comparison mode
            if (step.id === 'year-filtering' && this.app.comparisonMode) {
                element = document.querySelector('#comparison-mode-controls .year-range-container');
            }

            // For mobile menu elements, ensure we find the element within the mobile panel
            if (step.requiresMenuOpen) {
                const mobilePanel = document.querySelector('#mobile-controls-wrapper');
                if (mobilePanel) {
                    if (step.highlight === '#mobile-controls-wrapper') {
                        element = mobilePanel;
                    } else if (step.highlight.includes('.comparison-toggle')) {
                        // Look for comparison toggle specifically in mobile controls
                        element = mobilePanel.querySelector('.comparison-toggle') || element;
                    } else if (step.highlight.includes('.year-range')) {
                        // Look for year range controls in mobile panel
                        element = mobilePanel.querySelector('.year-range-container') || element;
                    }
                }
            }

            if (element && this.isElementVisible(element)) {
                element.classList.add('tutorial-highlighted');

                // Position spotlight
                const rect = element.getBoundingClientRect();
                spotlight.style.display = 'block';
                spotlight.style.left = (rect.left - 10) + 'px';
                spotlight.style.top = (rect.top - 10) + 'px';
                spotlight.style.width = (rect.width + 20) + 'px';
                spotlight.style.height = (rect.height + 20) + 'px';

                // Add pulse effect if specified
                if (step.pulse) {
                    spotlight.classList.add('pulse');
                } else {
                    spotlight.classList.remove('pulse');
                }

                // If interaction is allowed, make the element interactive
                if (step.allowInteraction) {
                    element.classList.add('interactive');

                    // Also make child interactive elements accessible
                    if (step.makeChildrenInteractive) {
                        const interactiveChildren = element.querySelectorAll('select, input, button, .toggle, .comparison-toggle, .year-range-container');
                        interactiveChildren.forEach(child => {
                            child.classList.add('interactive');
                        });
                    }
                }
            }
        } else {
            spotlight.style.display = 'none';
            spotlight.classList.remove('pulse');
        }
    }

    calculateOptimalPosition(element, tooltip) {
        if (!element) return null;

        const elementRect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const offset = 20; // Space between element and tooltip

        // Calculate available space in each direction
        const spaces = {
            top: elementRect.top,
            bottom: viewportHeight - elementRect.bottom,
            left: elementRect.left,
            right: viewportWidth - elementRect.right
        };

        // Determine best position (most available space)
        let bestPosition = 'center';
        let maxSpace = 0;

        // Check vertical positions
        if (spaces.bottom > tooltipRect.height + offset && spaces.bottom > maxSpace) {
            bestPosition = 'below';
            maxSpace = spaces.bottom;
        }
        if (spaces.top > tooltipRect.height + offset && spaces.top > maxSpace) {
            bestPosition = 'above';
            maxSpace = spaces.top;
        }

        // Check horizontal positions
        if (spaces.right > tooltipRect.width + offset && spaces.right > maxSpace) {
            bestPosition = 'right';
            maxSpace = spaces.right;
        }
        if (spaces.left > tooltipRect.width + offset && spaces.left > maxSpace) {
            bestPosition = 'left';
            maxSpace = spaces.left;
        }

        // Calculate actual position coordinates
        let top, left;

        switch (bestPosition) {
            case 'above':
                top = elementRect.top - tooltipRect.height - offset;
                left = elementRect.left + (elementRect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'below':
                top = elementRect.bottom + offset;
                left = elementRect.left + (elementRect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'left':
                top = elementRect.top + (elementRect.height / 2) - (tooltipRect.height / 2);
                left = elementRect.left - tooltipRect.width - offset;
                break;
            case 'right':
                top = elementRect.top + (elementRect.height / 2) - (tooltipRect.height / 2);
                left = elementRect.right + offset;
                break;
            default: // center
                top = (viewportHeight / 2) - (tooltipRect.height / 2);
                left = (viewportWidth / 2) - (tooltipRect.width / 2);
        }

        // Ensure tooltip stays within viewport boundaries
        top = Math.max(10, Math.min(top, viewportHeight - tooltipRect.height - 10));
        left = Math.max(10, Math.min(left, viewportWidth - tooltipRect.width - 10));

        return { top, left, position: bestPosition };
    }

    positionTooltip(step) {
        const tooltip = this.overlay.querySelector('.tutorial-tooltip');
        const isMobile = this.app.deviceManager && this.app.deviceManager.isMobile();

        // Reset classes
        tooltip.className = 'tutorial-tooltip';

        if (isMobile) {
            // Mobile: Use bottom sheet style, but adjust for FAB and menu when needed
            tooltip.classList.add('mobile-bottom-sheet');

            // If this step needs menu interaction, use smaller bottom sheet
            if (step.requiresMenuOpen) {
                tooltip.classList.add('menu-accessible');
            } else if (step.fabAccessible) {
                // If only FAB access needed, use intermediate size
                tooltip.classList.add('fab-accessible');
            }

            // Scroll highlighted element into view on mobile
            if (step.highlight) {
                const element = document.querySelector(step.highlight);
                if (element) {
                    setTimeout(() => {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                }
            }
        } else {
            // Desktop: Use dynamic positioning if specified, otherwise use fixed position
            if (step.position === 'dynamic' && step.highlight) {
                const element = document.querySelector(step.highlight);
                if (element && this.isElementVisible(element)) {
                    const position = this.calculateOptimalPosition(element, tooltip);
                    if (position) {
                        tooltip.classList.add('positioned');
                        tooltip.style.top = position.top + 'px';
                        tooltip.style.left = position.left + 'px';
                        tooltip.style.transform = 'none';
                        tooltip.setAttribute('data-position', position.position);
                        return;
                    }
                }
            }

            // Fallback to fixed positions
            switch (step.position) {
                case 'center':
                case 'dynamic': // Fallback for dynamic if element not found
                    tooltip.classList.add('center');
                    break;
                case 'left':
                    tooltip.classList.add('left');
                    break;
                case 'right':
                    tooltip.classList.add('right');
                    break;
                case 'above':
                    tooltip.classList.add('above');
                    break;
                case 'below':
                    tooltip.classList.add('below');
                    break;
                default:
                    tooltip.classList.add('center');
            }
        }
    }

    updateNavigation() {
        const prevBtn = this.overlay.querySelector('.tutorial-prev');
        const nextBtn = this.overlay.querySelector('.tutorial-next');

        prevBtn.disabled = this.currentStep === 0;

        // Update next button text for last step
        if (this.currentStep === this.tutorialData.length - 1) {
            nextBtn.textContent = 'Finish';
        } else {
            nextBtn.textContent = 'Next';
        }
    }

    updateProgress() {
        const dots = this.overlay.querySelectorAll('.progress-dot');
        dots.forEach((dot, index) => {
            if (index === this.currentStep) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    nextStep() {
        if (this.currentStep < this.tutorialData.length - 1) {
            this.showStep(this.currentStep + 1);
        } else {
            this.completeTutorial();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }

    skipTutorial() {
        this.endTutorial(false);
    }

    completeTutorial() {
        this.endTutorial(true);
    }

    endTutorial(completed = false) {
        if (!this.isActive) return;

        this.isActive = false;

        // Remove orientation lock
        document.body.classList.remove('tutorial-active');

        // Clean up
        document.removeEventListener('keydown', this.handleKeyPress.bind(this));

        // Remove highlights
        document.querySelectorAll('.tutorial-highlighted').forEach(el => {
            el.classList.remove('tutorial-highlighted', 'interactive');
        });

        // Remove overlay with animation
        if (this.overlay) {
            this.overlay.classList.add('tutorial-fade-out');
            setTimeout(() => {
                if (this.overlay) {
                    this.overlay.remove();
                    this.overlay = null;
                }
            }, 300);
        }

        // Mark as completed if finished
        if (completed) {
            localStorage.setItem('tc-tutorial-completed', 'true');
            localStorage.setItem('tc-tutorial-version', this.tutorialVersion);

            // Show completion message
            if (this.app.utils) {
                this.app.utils.showNotification('Tutorial completed! You can restart it anytime from the header menu.', 'success');
            }
        }
    }

    // Public method to restart tutorial
    restartTutorial() {
        localStorage.removeItem('tc-tutorial-completed');
        this.forcePortraitOrientation();
        this.startTutorial();
    }

    // Check if tutorial has been completed
    isTutorialCompleted() {
        const hasCompleted = localStorage.getItem('tc-tutorial-completed');
        const version = localStorage.getItem('tc-tutorial-version');
        return hasCompleted && version === this.tutorialVersion;
    }

    // Check if element is visible (not hidden by display: none)
    isElementVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        if (style.display === 'none') return false;

        // Check if any parent is hidden
        let parent = element.parentElement;
        while (parent) {
            const parentStyle = window.getComputedStyle(parent);
            if (parentStyle.display === 'none') return false;
            parent = parent.parentElement;
        }

        return true;
    }

    forcePortraitOrientation() {
        // Only force orientation on mobile devices
        const isMobile = this.app.deviceManager && this.app.deviceManager.isMobile();
        if (!isMobile) return;

        // Check if device is in landscape mode
        const isLandscape = window.innerWidth > window.innerHeight;

        if (isLandscape) {
            // Use Screen Orientation API if available
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('portrait').catch(err => {
                    // Fallback to CSS-based approach already implemented
                    this.showOrientationMessage();
                });
            } else {
                // Fallback for browsers without orientation lock support
                this.showOrientationMessage();
            }
        }
    }

    showOrientationMessage() {
        // The CSS already handles showing the orientation message
        // when body.tutorial-active is set and in landscape mode
        // This method exists for potential future enhancements
    }
}