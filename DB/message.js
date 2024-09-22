import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.1.0/+esm';

const supabaseUrl = 'https://zsqjmnedymplplesgyqx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzcWptbmVkeW1wbHBsZXNneXF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTE1MjU3NCwiZXhwIjoyMDQwNzI4NTc0fQ.9nFS1ko_awgRnFTbsshSwn-pnlIpQh855jiSL-x2-XU';
const supabase = createClient(supabaseUrl, supabaseKey);

let currentUser;

// Handle Enter key for login
window.handleLoginEnter = function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        loginUser();
    }
};

window.loginUser = async function () {
    const username = document.getElementById('username').value;
    const passcode = document.getElementById('passcode').value;

    if (!username || !passcode) {
        alert('Please enter both username and passcode.');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('passcode', passcode);

        if (error) throw error;

        if (data.length > 0) {
            currentUser = data[0];
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('user-name').textContent = `${currentUser.first_name} ${currentUser.last_name}`;
            document.getElementById('user-info').style.display = 'block';
            document.getElementById('message-input').style.display = 'block';
            document.getElementById('message-display').style.display = 'block';
            fetchMessages();
        } else {
            alert('Invalid username or passcode.');
        }
    } catch (err) {
        console.error('Error logging in:', err);
        alert('Error logging in. Please try again.');
    }
};

window.createAccount = async function () {
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const age = document.getElementById('age').value;
    const username = document.getElementById('new-username').value;
    const passcode = document.getElementById('new-passcode').value;

    if (!firstName || !lastName || !age || !username || !passcode) {
        alert('Please fill out all fields.');
        return;
    }

    try {
        const { data, error } = await supabase.from('users').insert([
            { first_name: firstName, last_name: lastName, age, username, passcode }
        ]).select().single();

        if (error) throw error;

        currentUser = data;
        document.getElementById('create-account-form').style.display = 'none';
        document.getElementById('user-name').textContent = `${currentUser.first_name} ${currentUser.last_name}`;
        document.getElementById('user-info').style.display = 'block';
        document.getElementById('message-input').style.display = 'block';
        document.getElementById('message-display').style.display = 'block';
        fetchMessages();
    } catch (err) {
        console.error('Error creating account:', err);
        alert('Error creating account. Please try again.');
    }
};

window.showCreateAccountForm = function () {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('create-account-form').style.display = 'block';
};

window.showLoginForm = function () {
    document.getElementById('create-account-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
};

window.signOut = function () {
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('message-input').style.display = 'none';
    document.getElementById('message-display').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    currentUser = null;
};

// Variables to handle the uploaded image URL
let uploadedImageUrl = '';

// Add the placeholder behavior
document.getElementById('message-content').setAttribute('data-placeholder', 'Enter your message');

// Detect input in the contenteditable div and hide the placeholder
document.getElementById('message-content').addEventListener('input', function() {
    if (this.innerHTML.trim() === '') {
        this.setAttribute('data-placeholder', 'Enter your message');
    } else {
        this.removeAttribute('data-placeholder');
    }
});

// Handle file input for image uploads
document.getElementById('image-input').addEventListener('change', async function(event) {
    const file = event.target.files[0]; // Get the selected file
    if (file) {
        uploadedImageUrl = await uploadFile(file); // Upload the image file
        if (uploadedImageUrl) {
            displayThumbnail(uploadedImageUrl); // Display the thumbnail above the upload button
        } else {
            alert('Error uploading image.');
        }
    }
});

// Function to display a thumbnail of the uploaded image and hide "Upload Pic" button
function displayThumbnail(imageUrl) {
    const imagePreviewContainer = document.getElementById('image-preview');
    imagePreviewContainer.innerHTML = `<img src="${imageUrl}" alt="Uploaded Image">`;

    // Hide the "Upload Pic" button after showing the image preview
    document.querySelector('button[onclick="document.getElementById(\'image-input\').click()"]').style.display = 'none';
}

// Function to upload a file to Supabase with duplicate handling
async function uploadFile(file) {
    try {
        // Create a unique file name by appending a timestamp
        const uniqueFileName = `${Date.now()}-${file.name}`;

        // Upload the image to the "myImages" bucket with the unique file name
        const { data, error } = await supabase.storage.from('myImages').upload(uniqueFileName, file);

        if (error) {
            console.error('Error uploading file:', error);
            return null;
        }

        // Get the public URL of the uploaded image
        const { data: publicUrlData } = supabase.storage.from('myImages').getPublicUrl(uniqueFileName);
        return publicUrlData.publicUrl; // Return the public URL of the uploaded image
    } catch (error) {
        console.error('Error during file upload:', error);
        return null;
    }
}

// Function to send the message or image URL
window.sendMessage = async function () {
    const content = document.getElementById('message-content').value;

    // If there's an uploaded image, insert it first as a separate entry
    if (uploadedImageUrl) {
        const { data: imageMessage, error: imageError } = await supabase.from('messages').insert([{ user_id: currentUser.id, content: uploadedImageUrl }]);
        if (imageError) {
            console.error('Error posting image message:', imageError);
            return;
        }
    }

    // Insert the text message as a separate entry if any text is entered
    if (content.trim()) {
        const { data: textMessage, error: textError } = await supabase.from('messages').insert([{ user_id: currentUser.id, content }]);
        if (textError) {
            console.error('Error posting text message:', textError);
            return;
        }
    }

    // Clear the message input and remove the image preview from DOM
    document.getElementById('message-content').value = '';
    document.getElementById('image-preview').innerHTML = ''; // Clear the image preview
    uploadedImageUrl = ''; // Reset the uploaded image URL

    // Show the "Upload Pic" button again
    document.querySelector('button[onclick="document.getElementById(\'image-input\').click()"]').style.display = 'inline-block';

    fetchMessages(); // Refresh the messages
};

// Modify the fetchMessages function to display text below the image
async function fetchMessages() {
    const { data: messages, error } = await supabase
        .from('messages')
        .select('id, content, created_at, users(first_name)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching messages:', error);
        return;
    }

    const messagesDisplay = document.getElementById('messages');
    messagesDisplay.innerHTML = '';
    messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        if (message.users.first_name === currentUser.first_name) {
            messageElement.classList.add('you');
        }

        const formattedDate = formatPostDate(message.created_at);

        // Create image-first, text-second structure
        messageElement.innerHTML = `
            <div class="message-author">
                ${message.users.first_name} <span style="font-size: smaller; color: #888;">${formattedDate}</span>
            </div>
            <div class="message-content">
                ${isImageUrl(message.content) ? `<img src="${message.content}" alt="Image" style="max-width: 200px; display: block; margin-bottom: 10px;">` : ''}
                ${!isImageUrl(message.content) ? `<p>${message.content}</p>` : ''}
            </div>
        `;
        messagesDisplay.appendChild(messageElement);
    });

    setTimeout(fetchMessages, 3000);
}

// Utility function to check if a string is a URL
function isImageUrl(content) {
    return content.match(/\.(jpeg|jpg|gif|png)$/i) !== null;
}


let lastMessageId = null;
let initialLoad = true;

function formatPostDate(createdAt) {
    const now = new Date();
    const postDate = new Date(createdAt);

    const timeDifference = now.getTime() - postDate.getTime();
    const oneDay = 24 * 60 * 60 * 1000; // One day in milliseconds

    if (timeDifference < oneDay && now.getDate() === postDate.getDate()) {
        // If the post was made today, return the time in hh:mm format
        return postDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeDifference < 2 * oneDay && now.getDate() - postDate.getDate() === 1) {
        // If the post was made yesterday
        return "yesterday";
    } else {
        // Otherwise, show "x days ago"
        const daysAgo = Math.floor(timeDifference / oneDay);
        return `${daysAgo} days ago`;
    }
}

window.handleEnter = function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
};