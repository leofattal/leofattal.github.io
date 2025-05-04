import { supabase } from './supabase.js';

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

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', async () => {
    showLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        loadUserInterface(session.user);
    } else {
        showLoading(false);
    }
});

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
            // If login fails, try to sign up
            const { data: signupData, error: signupError } = await supabase.auth.signUp({
                email,
                password,
                options: {
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
    authContainer.style.display = 'none';
    appContainer.style.display = 'block';

    // Try to get user profile, create one if it doesn't exist
    let { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

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
            data = userData;
        }
    }

    const name = data?.full_name || user.email.split('@')[0];
    welcomeMessage.textContent = `Bonjour, ${name}!`;

    // Add event listeners for module navigation
    setupModuleNavigation();

    // Setup exercise interaction
    setupExerciseInteraction();
}

// Module navigation
function setupModuleNavigation() {
    moduleItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items
            moduleItems.forEach(i => i.classList.remove('active'));

            // Add active class to clicked item
            item.classList.add('active');

            // Update content based on selected module
            // For now, we'll just update the title - in the future this would load from Supabase
            const moduleId = item.dataset.module;
            lessonTitle.textContent = item.textContent;

            // Mock updating lesson content (would fetch from DB in real implementation)
            updateMockLessonContent(moduleId);
        });
    });
}

// Mock function to update lesson content based on selected module
function updateMockLessonContent(moduleId) {
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
    recordButtons.forEach(button => {
        button.addEventListener('click', handleRecordButton);
    });

    // Setup submit buttons
    submitButtons.forEach(button => {
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

function handleSubmitButton(e) {
    const button = e.target;
    const responseContainer = button.closest('.exercise-response');
    const textArea = responseContainer.querySelector('textarea');

    if (textArea) {
        // Text submission
        const text = textArea.value.trim();
        if (text) {
            alert('Réponse soumise: ' + text);

            // In a real implementation, we would submit to Supabase here
            // For now, show a success message and clear the input
            textArea.value = '';
            button.textContent = 'Soumis!';
            setTimeout(() => {
                button.textContent = 'Soumettre';
            }, 3000);
        } else {
            alert('Veuillez entrer une réponse');
        }
    } else {
        // Audio submission
        alert('Enregistrement audio soumis');

        // Reset the audio player display
        button.textContent = 'Soumis!';
        setTimeout(() => {
            button.textContent = 'Soumettre';
            button.parentElement.style.display = 'none';
        }, 3000);
    }
}

logoutButton.addEventListener('click', async () => {
    await supabase.auth.signOut();
    appContainer.style.display = 'none';
    authContainer.style.display = 'block';
});