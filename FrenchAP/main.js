import { supabase } from './supabase.js';

// Log Supabase connection status
console.log("Supabase client initialized with URL:", supabase.supabaseUrl);
console.log("Connecting to Supabase...");

// Test Supabase connection
(async function testConnection() {
    try {
        const { data, error } = await supabase.from('lessons').select('count', { count: 'exact', head: true });
        if (error) {
            console.error("Supabase connection test failed:", error);
        } else {
            console.log("Successfully connected to Supabase");
        }
    } catch (e) {
        console.error("Error testing Supabase connection:", e);
    }
})();

// DOM elements
const authForm = document.getElementById('auth-form');
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const welcomeMessage = document.getElementById('welcome-message');
const logoutButton = document.getElementById('logout-button');
const moduleList = document.getElementById('module-list');
const moduleItems = moduleList.querySelectorAll('li');
const lessonTitle = document.getElementById('lesson-title');
const lessonContent = document.getElementById('lesson-content');
const exercisesContainer = document.getElementById('exercises-container');
const recordButtons = document.querySelectorAll('.record-btn');
const submitButtons = document.querySelectorAll('.submit-btn');
const authStatus = document.getElementById('auth-status');
const loadingIndicator = document.getElementById('loading-indicator');
const verificationMessage = document.getElementById('verification-message');
const authButton = document.getElementById('auth-button');
const googleSignInButton = document.getElementById('google-signin-button');

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', async () => {
    console.log("Application starting, checking for existing session...");
    console.log("Current URL:", window.location.href);

    // Add auth-mode class to body by default
    document.body.classList.add('auth-mode');

    // Store the current path for potential redirect after auth
    if (window.location.pathname.includes('/FrenchAP')) {
        localStorage.setItem('frenchAppUrl', window.location.href);
        console.log("Saved return path:", window.location.pathname);
    }

    showLoading(true);

    // Verify OAuth providers are configured
    try {
        // This endpoint only returns configured providers
        const response = await fetch(`${supabase.supabaseUrl}/auth/v1/providers`, {
            headers: {
                'apikey': supabase.supabaseKey
            }
        });
        const providers = await response.json();
        console.log("Available OAuth providers:", providers);

        // Check if Google is in the list
        const googleEnabled = providers.some(provider => provider.id === 'google');
        console.log("Google OAuth enabled:", googleEnabled);

        if (!googleEnabled) {
            console.warn("Google OAuth provider is not enabled in Supabase project!");
        }

        // Log the current URL for debugging redirect issues
        console.log("Current app URL:", window.location.href);
        console.log("Pathname:", window.location.pathname);
        console.log("Origin:", window.location.origin);

        // Print info about required Supabase configuration
        console.info("IMPORTANT: For proper redirects, configure Supabase Site URL in the dashboard:");
        console.info(`Site URL should be set to: ${window.location.origin}`);
        console.info(`Add Redirect URL: ${window.location.href}`);
    } catch (e) {
        console.error("Error checking OAuth providers:", e);
    }

    // Check for an auth callback in the URL (from OAuth redirect)
    const hasHashParams = window.location.hash.includes('access_token') ||
        window.location.hash.includes('error');
    const hasQueryParams = window.location.search.includes('code=') ||
        window.location.search.includes('error');

    if (hasHashParams || hasQueryParams) {
        console.log("Detected auth callback in URL, processing...");
        // The Supabase client will automatically handle the OAuth callback

        // Store URL to handle redirects properly
        const fullPath = window.location.href.split('?')[0].split('#')[0];
        console.log("Saving redirect path:", fullPath);
        localStorage.setItem('redirectPath', fullPath);
    }

    const { data: { session } } = await supabase.auth.getSession();
    console.log("Auth session check result:", session ? "User logged in" : "No active session");

    if (session) {
        console.log("Found active session, loading user interface", session.user.id);
        // Remove auth-mode class when logged in
        document.body.classList.remove('auth-mode');
        loadUserInterface(session.user);

        // Check if we need to redirect after auth
        if (window.location.href !== localStorage.getItem('redirectPath')) {
            const redirectPath = localStorage.getItem('redirectPath');
            if (redirectPath && redirectPath.includes('/FrenchAP')) {
                console.log("Redirecting to saved path:", redirectPath);
                window.location.href = redirectPath;
                return;
            }
        }
    } else {
        showLoading(false);
        // Initialize Google Sign-In
        initializeGoogleSignIn();
    }

    // Set up auth state change listener for OAuth redirects
    supabase.auth.onAuthStateChange((event, session) => {
        console.log("Auth state changed:", event, session ? "User session available" : "No session");

        if (event === 'SIGNED_IN' && session) {
            console.log("User signed in", session.user.id);
            // Remove auth-mode class when signed in
            document.body.classList.remove('auth-mode');
            loadUserInterface(session.user);

            // Check if we're at the root URL and need to redirect to the app
            if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                const savedAppUrl = localStorage.getItem('frenchAppUrl');
                if (savedAppUrl && savedAppUrl.includes('/FrenchAP')) {
                    console.log("Redirecting to saved app URL:", savedAppUrl);
                    window.location.href = savedAppUrl;
                    return;
                }
            }
        } else if (event === 'SIGNED_OUT') {
            console.log("User signed out");
            appContainer.style.display = 'none';
            authContainer.style.display = 'block';
            // Add auth-mode class when signed out
            document.body.classList.add('auth-mode');
            showLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session) {
            console.log("Session token refreshed", session.user.id);
        } else if (event === 'USER_UPDATED' && session) {
            console.log("User data updated", session.user.id);
        }
    });
});

// Initialize Google Sign-In button
function initializeGoogleSignIn() {
    // Make sure the container is visible
    googleSignInButton.style.display = 'block';

    // Create a custom Google sign-in button since we're using Supabase OAuth
    const googleButton = document.createElement('button');
    googleButton.type = 'button';
    googleButton.className = 'google-signin-btn';
    googleButton.innerHTML = '<img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo">Continue with Google';

    // Clear any existing content and append the button
    googleSignInButton.innerHTML = '';
    googleSignInButton.appendChild(googleButton);

    // Add click handler for Google sign-in
    googleButton.addEventListener('click', async () => {
        showLoading(true);
        try {
            // Construct the full redirect URL including the path and filename
            const currentUrl = window.location.href;
            const redirectUrl = new URL(currentUrl);

            // Ensure we keep the full path with index.html if present
            if (!redirectUrl.pathname.endsWith('index.html') && redirectUrl.pathname.endsWith('/')) {
                redirectUrl.pathname += 'index.html';
            }

            console.log("Setting Google OAuth redirect to:", redirectUrl.toString());

            // Use Supabase's OAuth flow with explicit redirect
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl.toString()
                }
            });

            if (error) {
                console.error("Error initiating Google sign-in:", error);
                showAuthError('Failed to initialize Google sign-in: ' + error.message);
                showLoading(false);
            } else {
                console.log("Google sign-in redirect initiated", data);
                // Store the intended return path
                localStorage.setItem('frenchAppUrl', redirectUrl.toString());
                // Redirect will happen automatically
            }
        } catch (e) {
            console.error("Exception during Google sign-in initialization:", e);
            showAuthError('An error occurred during Google sign-in initialization.');
            showLoading(false);
        }
    });

    // Log for debugging
    console.log("Google Sign-In button initialized");
}

// Authentication handling
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    showLoading(true);
    verificationMessage.style.display = 'none';

    // First try to sign in
    let { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        console.log("Login failed, attempting signup:", error.message);

        if (error.message.includes('Invalid login')) {
            // Construct the full redirect URL including the path and filename
            const currentUrl = window.location.href;
            const redirectUrl = new URL(currentUrl);

            // Ensure we keep the full path with index.html if present
            if (!redirectUrl.pathname.endsWith('index.html') && redirectUrl.pathname.endsWith('/')) {
                redirectUrl.pathname += 'index.html';
            }

            console.log("Setting email redirect to:", redirectUrl.toString());

            // If login fails, try to sign up
            const { data: signupData, error: signupError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: redirectUrl.toString(),
                    data: {
                        // Default role is student
                        role: 'student'
                    }
                }
            });

            if (signupError) {
                showAuthError('Signup failed: ' + signupError.message);
                return;
            }

            // Create profile entry in the profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                    id: signupData.user.id,
                    full_name: email.split('@')[0], // Default name from email
                    role: 'student',
                    created_at: new Date().toISOString()
                }]);

            if (profileError) {
                console.error('Error creating profile:', profileError);
                showAuthError('Account created but profile setup failed. Please contact support.');
                return;
            }

            // Show verification message
            verificationMessage.style.display = 'block';
            showAuthSuccess('Account created! Please check your email to confirm.');
            return;
        } else {
            showAuthError('Login failed: ' + error.message);
            return;
        }
    }

    // Check if email is confirmed if required by your Supabase settings
    if (data.user && data.user.email_confirmed_at === null) {
        verificationMessage.style.display = 'block';
        showAuthError('Please confirm your email address before logging in.');
        return;
    }

    // User successfully logged in
    showAuthSuccess('Login successful!');
    loadUserInterface(data.user);
});

// Show/hide loading indicator
function showLoading(show) {
    loadingIndicator.style.display = show ? 'block' : 'none';
    authButton.disabled = show;
}

// Show auth error message
function showAuthError(message) {
    showLoading(false);
    authStatus.innerHTML = `<span class="error-message">${message}</span>`;
}

// Show auth success message
function showAuthSuccess(message) {
    showLoading(false);
    authStatus.innerHTML = `<span class="success-message">${message}</span>`;
}

async function loadUserInterface(user) {
    console.log("Loading user interface for user ID:", user.id);
    console.log("Full user object:", user);
    console.log("User metadata:", user.user_metadata);
    console.log("App metadata:", user.app_metadata);

    authContainer.style.display = 'none';
    appContainer.style.display = 'block';

    // Try to get user profile, create one if it doesn't exist
    let { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    console.log("Profile lookup result:", { data, error });

    // If profile doesn't exist, create one
    if (error || !data) {
        console.log("Profile not found, creating profile for user:", user.id);

        const userData = {
            id: user.id,
            full_name: user.email.split('@')[0],
            role: (user.user_metadata && user.user_metadata.role) || 'student',
            created_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase.from('profiles').insert([userData]);

        if (insertError) {
            console.error("Error creating profile:", insertError);
        } else {
            console.log("Successfully created new profile");
            data = userData;
        }
    }

    const name = data?.full_name || user.email.split('@')[0];

    // Update user avatar if available from Google
    const userAvatar = document.getElementById('user-avatar');
    const defaultAvatarPath = 'Assets/avatar.png';

    // Log all possible avatar locations
    console.log("Checking for avatar in:", {
        userMetadataAvatar: user.user_metadata?.avatar_url,
        userMetadataPicture: user.user_metadata?.picture,
        userMetadataPhotoUrl: user.user_metadata?.photo_url,
        identitiesData: user.identities?.[0]?.identity_data
    });

    // Check all possible locations where Google might store the avatar URL
    let avatarUrl = null;

    // Common locations for profile pictures in different auth providers
    if (user.user_metadata?.avatar_url) {
        avatarUrl = user.user_metadata.avatar_url;
    } else if (user.user_metadata?.picture) {
        avatarUrl = user.user_metadata.picture;
    } else if (user.user_metadata?.photo_url) {
        avatarUrl = user.user_metadata.photo_url;
    } else if (user.identities && user.identities[0]?.identity_data?.avatar_url) {
        avatarUrl = user.identities[0].identity_data.avatar_url;
    } else if (user.identities && user.identities[0]?.identity_data?.picture) {
        avatarUrl = user.identities[0].identity_data.picture;
    } else if (data && data.avatar_url) {
        avatarUrl = data.avatar_url;
    }

    if (avatarUrl) {
        userAvatar.src = avatarUrl;
        console.log("Set user avatar:", avatarUrl);

        // Add error handler to fallback to default avatar if loading fails
        userAvatar.onerror = function () {
            console.log("Error loading avatar, falling back to default");
            this.src = defaultAvatarPath;
            this.onerror = null; // Prevent infinite loop if default also fails
        };

        // Also update the profile in the database if needed
        if (data && !data.avatar_url) {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: avatarUrl })
                .eq('id', user.id);

            if (updateError) {
                console.error("Error updating profile with avatar:", updateError);
            } else {
                console.log("Updated profile with avatar URL");
            }
        }
    } else {
        // Ensure we use the default avatar if no custom avatar is found
        userAvatar.src = defaultAvatarPath;
        console.log("Using default avatar");
    }

    // Show user's name
    welcomeMessage.textContent = `Bonjour, ${name}!`;
    console.log("User interface loaded, setting up modules...");

    // Add event listeners for module navigation
    setupModuleNavigation();
}

// Module navigation
async function setupModuleNavigation() {
    try {
        console.log("Attempting to fetch lessons from Supabase...");

        // First try to fetch lessons from Supabase
        const { data: lessons, error } = await supabase
            .from('lessons')
            .select('id, title')
            .order('id');

        console.log("Supabase lessons response:", { lessons, error });

        if (error || !lessons || lessons.length === 0) {
            console.log("Could not fetch lessons from Supabase or no lessons found. Using mock data.");
            setupMockModuleNavigation();
            return;
        }

        console.log("Successfully loaded", lessons.length, "lessons from Supabase");

        // Clear existing module list
        moduleList.innerHTML = '';

        // Add lessons to module list
        lessons.forEach((lesson, index) => {
            const li = document.createElement('li');
            li.textContent = lesson.title;
            li.dataset.module = lesson.id;

            if (index === 0) {
                li.classList.add('active');
                loadLesson(lesson.id);
            }

            li.addEventListener('click', () => {
                // Remove active class from all items
                moduleList.querySelectorAll('li').forEach(i => i.classList.remove('active'));

                // Add active class to clicked item
                li.classList.add('active');

                // Load lesson content
                loadLesson(lesson.id);
            });

            moduleList.appendChild(li);
        });
    } catch (e) {
        console.error("Error setting up module navigation:", e);
        console.log("Falling back to mock data due to error");
        // Fallback to mock data
        setupMockModuleNavigation();
    }
}

// Fallback to mock module navigation if Supabase fetch fails
function setupMockModuleNavigation() {
    console.log("Setting up mock module navigation with hardcoded data");
    moduleItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items
            moduleItems.forEach(i => i.classList.remove('active'));

            // Add active class to clicked item
            item.classList.add('active');

            // Update content based on selected module
            const moduleId = item.dataset.module;
            lessonTitle.textContent = item.textContent;

            // Mock updating lesson content
            updateMockLessonContent(moduleId);
        });
    });
}

// Function to load lesson content from Supabase
async function loadLesson(lessonId) {
    try {
        console.log("Attempting to load lesson content for ID:", lessonId);

        // Fetch lesson content
        const { data: lesson, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('id', lessonId)
            .single();

        console.log("Supabase lesson response:", { lesson, error });

        if (error) {
            console.error('Error fetching lesson:', error);
            lessonContent.innerHTML = '<p>Error loading lesson content.</p>';
            return;
        }

        console.log("Successfully loaded lesson:", lesson.title);

        // Update lesson title and content
        lessonTitle.textContent = lesson.title;
        lessonContent.innerHTML = lesson.html_content;

        // Fetch exercises for this lesson
        loadExercises(lessonId);
    } catch (e) {
        console.error("Error loading lesson:", e);
        lessonContent.innerHTML = '<p>Error loading lesson content.</p>';
    }
}

// Function to load exercises for a lesson
async function loadExercises(lessonId) {
    try {
        console.log("Attempting to load exercises for lesson ID:", lessonId);

        // Fetch exercises for this lesson
        const { data: exercises, error } = await supabase
            .from('exercises')
            .select('*')
            .eq('lesson_id', lessonId);

        console.log("Supabase exercises response:", { exercises, error });

        if (error || !exercises || exercises.length === 0) {
            console.log("Could not fetch exercises or no exercises found for lesson:", lessonId);
            // Use mock exercises if needed
            return;
        }

        console.log("Successfully loaded", exercises.length, "exercises");

        // Clear existing exercises
        exercisesContainer.innerHTML = '<h3>Exercices</h3>';

        // Add exercises to container
        exercises.forEach(exercise => {
            console.log("Processing exercise:", exercise.id, exercise.prompt.substring(0, 30) + "...");

            const exerciseDiv = document.createElement('div');
            exerciseDiv.className = 'exercise';
            exerciseDiv.dataset.id = exercise.id;

            const promptDiv = document.createElement('div');
            promptDiv.className = 'exercise-prompt';
            promptDiv.innerHTML = `<p><strong>Exercise:</strong> ${exercise.prompt}</p>`;

            const responseDiv = document.createElement('div');
            responseDiv.className = 'exercise-response';

            if (exercise.question_type === 'text') {
                responseDiv.innerHTML = `
                    <textarea placeholder="Tapez votre réponse ici..."></textarea>
                    <button class="submit-btn" data-exercise="${exercise.id}">Soumettre</button>
                `;
            } else if (exercise.question_type === 'audio') {
                responseDiv.innerHTML = `
                    <button class="record-btn">Enregistrer Audio</button>
                    <div class="audio-player" style="display: none;">
                        <audio controls></audio>
                        <button class="submit-btn" data-exercise="${exercise.id}">Soumettre</button>
                    </div>
                `;
            }

            exerciseDiv.appendChild(promptDiv);
            exerciseDiv.appendChild(responseDiv);
            exercisesContainer.appendChild(exerciseDiv);
        });

        // Reattach event listeners
        document.querySelectorAll('.record-btn').forEach(button => {
            button.addEventListener('click', handleRecordButton);
        });

        document.querySelectorAll('.submit-btn').forEach(button => {
            button.addEventListener('click', handleSubmitButton);
        });
    } catch (e) {
        console.error("Error loading exercises:", e);
    }
}

// Mock function to update lesson content based on selected module (fallback)
function updateMockLessonContent(moduleId) {
    console.log("Using mock lesson content for module ID:", moduleId);

    const mockContent = {
        '1': `
      <p>Bienvenue au premier module de français AP! Dans cette leçon, nous allons explorer les bases de la langue française.</p>
      <p>Le français est une langue romane parlée par environ 300 millions de personnes dans le monde.</p>
      <h3>Vocabulaire essentiel</h3>
      <ul>
        <li>Bonjour - Hello</li>
        <li>Au revoir - Goodbye</li>
        <li>Merci - Thank you</li>
        <li>S'il vous plaît - Please</li>
      </ul>
    `,
        '2': `
      <p>Dans ce module, nous explorons le vocabulaire et les expressions liés à la famille.</p>
      <h3>Vocabulaire de la famille</h3>
      <ul>
        <li>Les parents - Parents</li>
        <li>Le père - Father</li>
        <li>La mère - Mother</li>
        <li>Le frère - Brother</li>
        <li>La sœur - Sister</li>
      </ul>
      <p>En français, les relations familiales sont souvent exprimées avec des adjectifs possessifs comme "mon", "ma", "mes".</p>
    `,
        '3': `
      <p>Ce module est consacré aux activités de loisirs et aux passe-temps.</p>
      <h3>Vocabulaire des loisirs</h3>
      <ul>
        <li>Jouer au foot - To play soccer</li>
        <li>Lire un livre - To read a book</li>
        <li>Regarder un film - To watch a movie</li>
        <li>Écouter de la musique - To listen to music</li>
      </ul>
      <p>Pour parler de vos passe-temps, vous pouvez utiliser l'expression "J'aime" (I like) ou "J'adore" (I love).</p>
    `,
        '4': `
      <p>Dans ce module, nous allons apprendre à parler de notre routine quotidienne.</p>
      <h3>Vocabulaire de la vie quotidienne</h3>
      <ul>
        <li>Se réveiller - To wake up</li>
        <li>Se brosser les dents - To brush one's teeth</li>
        <li>Prendre le petit-déjeuner - To have breakfast</li>
        <li>Aller à l'école - To go to school</li>
      </ul>
      <p>Les verbes pronominaux comme "se réveiller" et "se brosser" sont très courants pour décrire les activités quotidiennes.</p>
    `
    };

    lessonContent.innerHTML = mockContent[moduleId] || mockContent['1'];
}

// Setup exercise interaction
function setupExerciseInteraction() {
    // Setup record buttons
    document.querySelectorAll('.record-btn').forEach(button => {
        button.addEventListener('click', handleRecordButton);
    });

    // Setup submit buttons
    document.querySelectorAll('.submit-btn').forEach(button => {
        button.addEventListener('click', handleSubmitButton);
    });
}

function handleRecordButton(e) {
    const button = e.target;
    const audioPlayer = button.parentElement.querySelector('.audio-player');

    // Toggle recording state (this is just a mockup)
    if (button.textContent === 'Enregistrer Audio') {
        button.textContent = 'Arrêter l\'enregistrement';
        button.style.backgroundColor = '#dc3545';

        // In a real implementation, we would start recording here
        // For the mockup, we'll simulate recording after a delay
        setTimeout(() => {
            button.textContent = 'Enregistrer Audio';
            button.style.backgroundColor = '';
            audioPlayer.style.display = 'block';
        }, 3000);
    } else {
        button.textContent = 'Enregistrer Audio';
        button.style.backgroundColor = '';
    }
}

async function handleSubmitButton(e) {
    const button = e.target;
    const responseContainer = button.closest('.exercise-response');
    const textArea = responseContainer.querySelector('textarea');
    const exerciseId = button.dataset.exercise;

    if (!exerciseId) {
        console.error("No exercise ID found for submission");
        alert('Une erreur est survenue lors de la soumission.');
        return;
    }

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert('Vous devez être connecté pour soumettre une réponse.');
        return;
    }

    try {
        if (textArea) {
            // Text submission
            const text = textArea.value.trim();
            if (!text) {
                alert('Veuillez entrer une réponse');
                return;
            }

            // Try to save to Supabase submissions table
            const { error } = await supabase
                .from('submissions')
                .insert([{
                    exercise_id: exerciseId,
                    user_id: session.user.id,
                    answer: text,
                    submitted_at: new Date().toISOString()
                }]);

            if (error) {
                console.error("Error saving submission:", error);
                alert('Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.');
                return;
            }

            // Show success and clear input
            alert('Réponse soumise avec succès!');
            textArea.value = '';
            button.textContent = 'Soumis!';
            setTimeout(() => {
                button.textContent = 'Soumettre';
            }, 3000);

        } else {
            // Audio submission (would need file handling in a real implementation)
            alert('Enregistrement audio soumis');

            // In a real implementation, we would upload the audio file here

            // Reset the audio player display
            button.textContent = 'Soumis!';
            setTimeout(() => {
                button.textContent = 'Soumettre';
                button.parentElement.style.display = 'none';
            }, 3000);
        }
    } catch (e) {
        console.error("Error in submission handling:", e);
        alert('Une erreur est survenue. Veuillez réessayer.');
    }
}

logoutButton.addEventListener('click', async () => {
    await supabase.auth.signOut();

    // Save FrenchAP path before reload if needed
    if (window.location.pathname.includes('/FrenchAP')) {
        localStorage.setItem('frenchAppUrl', window.location.href);
    }

    // Instead of trying to manipulate the DOM, simply reload the page
    // This ensures all styles and elements are properly initialized
    window.location.reload();
});