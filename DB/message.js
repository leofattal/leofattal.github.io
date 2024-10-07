import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.1.0/+esm';

const supabaseUrl = 'https://zsqjmnedymplplesgyqx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzcWptbmVkeW1wbHBsZXNneXF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTE1MjU3NCwiZXhwIjoyMDQwNzI4NTc0fQ.9nFS1ko_awgRnFTbsshSwn-pnlIpQh855jiSL-x2-XU';
const supabase = createClient(supabaseUrl, supabaseKey);

let currentUser;
let currentChatroomId = null;  // Track current chatroom ID
let currentChatroomName = 'General Chat';  // Default name

let messageSubscription; // Variable to track current subscription

function subscribeToChatroomMessages(chatroomId) {
    // Unsubscribe from the previous subscription, if any
    if (messageSubscription) {
        messageSubscription.unsubscribe();
    }

    // Subscribe to the new chatroom
    supabase
        .channel('insert-db-changes')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
            //filter: chatroomId ? `chatroom_id=eq.${chatroomId}` : 'chatroom_id=is.null' // General chatroom has null chatroom_id
        }, payload => {
            const newMessage = payload.new;
            console.log(newMessage);
            displayRealTimeMessage(newMessage); // Add the new message to the feed
        })
        .subscribe();

    // Subscribe to real-time DELETE (message deletions)
    supabase
        .channel('delete-db-changes')
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, payload => {
            const deletedMessage = payload.old;
            removeDeletedMessageFromUI(deletedMessage.id); // Remove the deleted message from the UI
        })
        .subscribe();
}

// Handle Enter key for login
window.handleLoginEnter = function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        loginUser();
    }
};

window.onload = function () {
    const storedUser = sessionStorage.getItem('user');

    if (storedUser) {
        // Automatically log the user in
        currentUser = JSON.parse(storedUser);
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('user-name').textContent = `${currentUser.first_name} ${currentUser.last_name}`;
        document.getElementById('user-info').style.display = 'block';
        document.getElementById('message-input-container').style.display = 'block';
        document.getElementById('message-display').style.display = 'block';

        // Subscribe to the General Chatroom real-time updates
        currentChatroomId = null;  // General chatroom has chatroom_id null
        subscribeToChatroomMessages(currentChatroomId);  // Subscribe to General Chat
        attachEventListenersAfterLogin(); // Attach listeners after login is successful
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
            const user = data[0];
            // If login successful, store user in sessionStorage
            sessionStorage.setItem('user', JSON.stringify(user));  // Save the user data
            currentUser = user;  // Update the currentUser variable

            document.getElementById('login-form').style.display = 'none';
            document.getElementById('user-name').textContent = `${currentUser.first_name} ${currentUser.last_name}`;
            document.getElementById('user-info').style.display = 'block';
            document.getElementById('message-input-container').style.display = 'block';
            document.getElementById('message-display').style.display = 'block';
            attachEventListenersAfterLogin(); // Attach listeners after login is successful
        } else {
            alert('Invalid username or passcode.');
        }
    } catch (err) {
        console.error('Error logging in:', err);
        alert('Error logging in. Please try again.');
    }
};

// Create the close icon (span)
const closeIcon = document.createElement('span');

// Attach event listeners after login
function attachEventListenersAfterLogin() {
    const generateButton = document.getElementById('generate-button');
    if (generateButton) {
        generateButton.addEventListener('click', generateImage);
    }
    if (closeIcon) {
        closeIcon.innerHTML = '&times;';
        closeIcon.style.position = 'absolute';
        closeIcon.style.top = '5px';
        closeIcon.style.right = '5px';
        closeIcon.style.background = 'rgba(255, 255, 255, 0.7)';
        closeIcon.style.padding = '5px';
        closeIcon.style.borderRadius = '50%';
        closeIcon.style.cursor = 'pointer';
        closeIcon.style.fontSize = '16px';
        closeIcon.style.fontWeight = 'bold';
        closeIcon.addEventListener('click', cancelPic);
    }
    const messagesDisplay = document.getElementById('messages');
    messagesDisplay.addEventListener('scroll', () => {
        // Check if the user has scrolled to the bottom of the feed
        // console.log(messagesDisplay.clientHeight - messagesDisplay.scrollTop, messagesDisplay.scrollHeight );
        if (Math.ceil(Math.abs(messagesDisplay.scrollTop - messagesDisplay.clientHeight)) === messagesDisplay.scrollHeight) {
            console.log('scrolling...');
            loadMoreMessages();  // Load more messages when the user reaches the bottom of the feed
        }
    });

    document.getElementById('chatroom-management').style.display = 'block';
    fetchChatrooms();  // Show available chatrooms to join
    fetchMessages();
}

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
        document.getElementById('message-input-container').style.display = 'block';
        document.getElementById('message-display').style.display = 'block';
        fetchMessages(true);
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
    document.getElementById('message-input-container').style.display = 'none';
    document.getElementById('message-display').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    currentUser = null;
};

// Function to create a new chatroom
window.createChatroom = async function () {
    const chatroomName = document.getElementById('new-chatroom-name').value;

    if (!chatroomName) {
        alert('Please enter a chatroom name.');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('chatroom')
            .insert([{ name: chatroomName }])
            .select().single();

        if (error) throw error;

        alert(`Chatroom "${chatroomName}" created successfully!`);
        currentChatroomId = data.id;  // Set the new chatroom ID
        currentChatroomName = chatroomName;  // Set the new chatroom name
        fetchMessages();  // Load messages for the new chatroom
        document.getElementById('new-chatroom-name').value = '';  // Clear the input
    } catch (err) {
        console.error('Error creating chatroom:', err);
        alert('Error creating chatroom. Please try again.');
    }
};

// Function to join a chatroom
window.joinChatroom = async function (chatroomId, chatroomName) {
    try {
        const { error } = await supabase
            .from('chatroom_participants')
            .insert([{ user_id: currentUser.id, chatroom_id: chatroomId }]);

        if (error) throw error;

        currentChatroomId = chatroomId;  // Set the joined chatroom ID
        currentChatroomName = chatroomName;  // Set the joined chatroom name
        fetchMessages();  // Load messages from the new chatroom
    } catch (err) {
        console.error('Error joining chatroom:', err);
        alert('Error joining chatroom. Please try again.');
    }
};

// Show input field and submit button
window.showCreateChatroomInput = function () {
    document.getElementById('new-chatroom-name').style.display = 'block';  // Show input field
    document.querySelector('button[onclick="createChatroom()"]').style.display = 'block';  // Show submit button
};

// Fetch available chatrooms and add them to the dropdown
window.fetchChatrooms = async function () {
    const { data: chatrooms, error } = await supabase.from('chatroom').select();

    if (error) {
        console.error('Error fetching chatrooms:', error);
        return;
    }

    const chatroomDropdown = document.getElementById('chatroom-dropdown');
    chatroomDropdown.innerHTML = ''; // Clear current dropdown options

    // Add the "General Chat" option
    const generalOption = document.createElement('option');
    generalOption.value = 'general';
    generalOption.textContent = 'General Chat';
    chatroomDropdown.appendChild(generalOption);

    // Add available chatrooms to the dropdown
    chatrooms.forEach(chatroom => {
        const option = document.createElement('option');
        option.value = chatroom.id; // Use chatroom ID as value
        option.textContent = chatroom.name; // Display chatroom name
        chatroomDropdown.appendChild(option);
    });
};

window.handleChatroomChange = function () {
    const chatroomDropdown = document.getElementById('chatroom-dropdown');
    const selectedChatroomId = chatroomDropdown.value;

    if (selectedChatroomId === 'general') {
        currentChatroomId = null;  // General chat has null chatroom_id
        currentChatroomName = 'General Chat';
    } else {
        currentChatroomId = selectedChatroomId;
        currentChatroomName = chatroomDropdown.options[chatroomDropdown.selectedIndex].text;
    }

    fetchMessages();  // Optionally fetch the last few messages for the new chatroom
    // subscribeToChatroomMessages(currentChatroomId);  // Subscribe to real-time updates for the new chatroom
};

// Variables to handle the uploaded image URL
let uploadedImageUrl = '';

// Add the placeholder behavior
document.getElementById('message-content').setAttribute('data-placeholder', 'Enter your message');

// Detect input in the contenteditable div and hide the placeholder
document.getElementById('message-content').addEventListener('input', function () {
    if (this.innerHTML.trim() === '') {
        this.setAttribute('data-placeholder', 'Enter your message');
    } else {
        this.removeAttribute('data-placeholder');
    }
});

// Handle file input for image uploads
document.getElementById('image-input').addEventListener('change', async function (event) {
    const file = event.target.files[0]; // Get the selected file
    if (file) {
        showLoadingSpinner();
        document.getElementById('generate-button').style.display = 'none'; // Hide Generate Pic button
        uploadedImageUrl = await uploadFile(file); // Upload the image file
        if (uploadedImageUrl) {
            displayThumbnail(uploadedImageUrl); // Display the thumbnail above the upload button
            document.getElementById('upload-button').style.display = 'none'; // Hide Upload Pic button
        } else {
            alert('Error uploading image.');
        }
    }
});

// Function to display a thumbnail of the uploaded image above the upload button
function displayThumbnail(imageUrl) {
    const imagePreviewContainer = document.getElementById('image-preview');
    // Create a wrapper div for the image and close button
    const wrapperDiv = document.createElement('div');
    wrapperDiv.style.position = 'relative';
    wrapperDiv.style.display = 'inline-block';

    // Create the image element
    const imgElement = document.createElement('img');
    imgElement.src = imageUrl;
    imgElement.alt = 'Uploaded Image';
    imgElement.style.maxWidth = '100%';
    imgElement.style.height = 'auto';

    // Append the image and close icon to the wrapper div
    wrapperDiv.appendChild(imgElement);
    imgElement.onload = function () {
        wrapperDiv.appendChild(closeIcon);
    }

    // Clear any existing content in the image preview container and add the new content
    imagePreviewContainer.innerHTML = '';
    imagePreviewContainer.appendChild(wrapperDiv);
}

async function cancelPic() {
    const imagePreviewContainer = document.getElementById('image-preview');
    imagePreviewContainer.innerHTML = '';
    uploadedImageUrl = '';
    // Show the "Upload & Generate Pic" buttons again
    document.getElementById('upload-button').style.display = 'block';
    document.getElementById('generate-button').style.display = 'block';
}

// Function to show a loading spinner in the image-preview div
function showLoadingSpinner() {
    const imagePreviewContainer = document.getElementById('image-preview');
    imagePreviewContainer.innerHTML = `<div class="spinner"></div>`; // Add CSS for spinner in your style
}

// Function to generate an image from the Hugging Face API
async function generateImage() {
    const prompt = document.getElementById('message-content').value;

    if (!prompt.trim()) {
        alert("Please enter a prompt to generate an image.");
        return;
    }

    showLoadingSpinner(); // Show loading spinner while waiting for image generation
    const endpoint = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev';
    // const endpoint = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell';
    // const endpoint = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer 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',  // Replace with your actual Hugging Face API key
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: prompt,
                options: { seed: Math.floor(Math.random() * 1000000) }
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const blob = await response.blob();
        const file = new File([blob], 'genAI.jpg', { type: 'image/jpeg' });
        uploadedImageUrl = await uploadFile(file); // Upload the image file
        if (uploadedImageUrl) {
            displayThumbnail(uploadedImageUrl); // Display the generated image in the preview area
            document.getElementById('upload-button').style.display = 'none'; // Hide Upload Pic button
        } else {
            alert('Error uploading image.');
        }
    } catch (error) {
        console.error('Error generating image:', error);
        alert('Error generating image. Please try again.');
    }
}

// Function to send the message or image URL
window.sendMessage = async function () {
    const content = document.getElementById('message-content').value;

    // Initialize the messageData as the content string (in case there's no image)
    let messageData = content.trim();

    // If there's an uploaded image, create a JSON structure with the image URL and message content
    if (uploadedImageUrl) {
        messageData = {
            image_url: uploadedImageUrl,
            content: content.trim() // Keep it in case there's text as well
        };
    } else {
        if (!messageData) return; // do nothing if no image and no text
    }

    // Insert the message as either a string or a JSON object depending on whether there's an image
    await supabase.from('messages').insert([{
        user_id: currentUser.id,
        content: typeof messageData === 'string' ? messageData : JSON.stringify(messageData),
        chatroom_id: currentChatroomId  // Use the currently active chatroom ID
    }]);

    // Clear the message input and remove the image preview from DOM
    document.getElementById('message-content').value = '';
    document.getElementById('image-preview').innerHTML = ''; // Clear the image preview
    uploadedImageUrl = ''; // Reset the uploaded image URL

    // Show the "Upload & Generate Pic" buttons again
    document.getElementById('upload-button').style.display = 'block';
    document.getElementById('generate-button').style.display = 'block';

    fetchMessages(true); // Refresh the messages
};

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

// Modify the fetchMessages function to display text below the image
let lastMessageId = null;  // Keep track of the last loaded message ID

async function fetchMessages(initialLoad = false) {
    let query = supabase
        .from('messages')
        .select('id, content, created_at, users(first_name)')
        .order('created_at', { ascending: false })
        .limit(20);

    // If currentChatroomId is not set (general chatroom), fetch messages with chatroom_id IS NULL
    if (currentChatroomId === null) {
        query = query.is('chatroom_id', null);  // Use `is` to handle NULL
    } else {
        query = query.eq('chatroom_id', currentChatroomId);  // Specific chatroom
    }

    const { data: messages, error } = await query;

    if (error) {
        console.error('Error fetching messages:', error);
        return;
    }

    const messagesDisplay = document.getElementById('messages');
    messagesDisplay.innerHTML = '';
    messages.forEach(message => {
        // console.log(message);
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        if (message.users.first_name === currentUser.first_name) {
            messageElement.classList.add('you');
        }

        const formattedDate = formatPostDate(message.created_at);

        let contentHtml = '';

        try {
            // Attempt to parse the content as JSON
            const messageData = JSON.parse(message.content);

            if (messageData.image_url) {
                // If there is an image URL in the JSON, display the image
                contentHtml += `<img src="${messageData.image_url}" alt="Image" style="max-width: 200px; display: block; margin-bottom: 10px;">`;
            }

            if (messageData.content) {
                // If there is text content in the JSON, display it under the image
                contentHtml += `<p>${messageData.content}</p>`;
            }
        } catch (e) {
            // If parsing fails, the content is not JSON, handle it as a string
            if (isImageUrl(message.content)) {
                // If the content is an image URL, display the image
                contentHtml = `<img src="${message.content}" alt="Image" style="max-width: 200px; display: block; margin-bottom: 10px;">`;
            } else if (isSingleEmoji(message.content)) {
                // If it's a single emoji, display it with special formatting
                contentHtml = `<p style="font-size: 3em; margin: 0;">${message.content}</p>`;
            } else {
                // Otherwise, treat it as regular text content
                contentHtml = `<p>${message.content}</p>`;
            }
        }

        // Create the final message structure with the message content
        messageElement.innerHTML = `
        <div class="message-author">
            ${message.users.first_name} <span style="font-size: smaller; color: #888;">${formattedDate}</span>
        </div>
        <div class="message-content" style="max-width: 200px;">${contentHtml}</div>
        `;

        // If it's the current user's message, add right-click/long press event for deletion
        if (message.users.first_name === currentUser.first_name) {
            // Right-click for desktop
            messageElement.addEventListener('contextmenu', function (event) {
                event.preventDefault();
                confirmDelete(message.id, messageElement);
            });

            // Long-press for mobile (optional)
            let pressTimer;
            messageElement.addEventListener('touchstart', function (event) {
                pressTimer = setTimeout(() => confirmDelete(message.id, messageElement), 800); // Long press triggers after 800ms
            });

            messageElement.addEventListener('touchend', function () {
                clearTimeout(pressTimer); // Cancel long press if touch ends before 800ms
            });
        }
        // Set the id of the message element to match the message id in the database
        messageElement.id = `message-${message.id}`;
        messagesDisplay.appendChild(messageElement);
    });
    // Update lastMessageId to the **oldest message ID** in the current batch
    if (messages.length > 0) {
        lastMessageId = messages[messages.length - 1].id;  // Oldest message ID
    }
    // setTimeout(fetchMessages, 3000);
}

// Function to display new messages in real-time
async function displayRealTimeMessage(message) {
    // Check if the message belongs to the current chatroom
    if (message.chatroom_id !== currentChatroomId) return;

    const messagesDisplay = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    // Fetch user info from the database
    const { data: user, error } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', message.user_id)
        .single();

    if (user.first_name === currentUser.first_name) {
        messageElement.classList.add('you');
    }

    const formattedDate = formatPostDate(message.created_at);

    let contentHtml = '';

    try {
        // Attempt to parse the content as JSON
        const messageData = JSON.parse(message.content);

        if (messageData.image_url) {
            // If there is an image URL in the JSON, display the image
            contentHtml += `<img src="${messageData.image_url}" alt="Image" style="max-width: 200px; display: block; margin-bottom: 10px;">`;
        }

        if (messageData.content) {
            // If there is text content in the JSON, display it under the image
            contentHtml += `<p>${messageData.content}</p>`;
        }
    } catch (e) {
        // If parsing fails, the content is not JSON, handle it as a string
        if (isImageUrl(message.content)) {
            // If the content is an image URL, display the image
            contentHtml = `<img src="${message.content}" alt="Image" style="max-width: 200px; display: block; margin-bottom: 10px;">`;
        } else if (isSingleEmoji(message.content)) {
            // If it's a single emoji, display it with special formatting
            contentHtml = `<p style="font-size: 3em; margin: 0;">${message.content}</p>`;
        } else {
            // Otherwise, treat it as regular text content
            contentHtml = `<p>${message.content}</p>`;
        }
    }

    // Create the final message structure with the message content
    messageElement.innerHTML = `
        <div class="message-author">
            ${user.first_name} <span style="font-size: smaller; color: #888;">${formattedDate}</span>
        </div>
        <div class="message-content" style="max-width: 200px;">${contentHtml}</div>
        `;

    // If it's the current user's message, add right-click/long press event for deletion
    if (user.first_name === currentUser.first_name) {
        // Right-click for desktop
        messageElement.addEventListener('contextmenu', function (event) {
            event.preventDefault();
            confirmDelete(message.id, messageElement);
        });

        // Long-press for mobile (optional)
        let pressTimer;
        messageElement.addEventListener('touchstart', function (event) {
            pressTimer = setTimeout(() => confirmDelete(message.id, messageElement), 800); // Long press triggers after 800ms
        });

        messageElement.addEventListener('touchend', function () {
            clearTimeout(pressTimer); // Cancel long press if touch ends before 800ms
        });
    }
    // Set the id of the message element to match the message id in the database
    messageElement.id = `message-${message.id}`;
    // Insert the new message at the top of the message list
    if (messagesDisplay.firstChild) {
        messagesDisplay.insertBefore(messageElement, messagesDisplay.firstChild);
    } else {
        // If there are no messages yet, just append the message
        messagesDisplay.appendChild(messageElement);
    }
}

function removeDeletedMessageFromUI(messageID) {
    // if (message.chatroom_id !== currentChatroomId) return;
    // Find the message element in the DOM by using the message's id
    const messageElement = document.getElementById(`message-${messageID}`);

    if (messageElement) {
        console.log(`found message-${messageID}` );
        // Remove the message element from the DOM
        messageElement.remove();
    }
}

// Utility function to check if the content is a single emoji
function isSingleEmoji(content) {
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u;
    return emojiRegex.test(content.trim());
}

// Utility function to check if a string is a URL
function isImageUrl(content) {
    return content.match(/\.(jpeg|jpg|gif|png)$/i) !== null;
}

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

function confirmDelete(messageId, messageElement) {
    const confirmDelete = confirm("Are you sure you want to delete this post?");
    if (confirmDelete) {
        // Call the function to delete the post from the database
        deletePost(messageId, messageElement);
    }
}

async function deletePost(messageId, messageElement) {
    try {
        // Delete the message from Supabase
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', messageId);

        if (error) {
            console.error('Error deleting message:', error);
            alert('Failed to delete the message. Please try again.');
            return;
        }

        // Remove the message from the UI
        messageElement.remove();

        // Optionally, you can show a success message
        //alert('Message deleted successfully.');
    } catch (err) {
        console.error('Error deleting post:', err);
        alert('An error occurred while deleting the message.');
    }
}

async function loadMoreMessages() {

    let query = supabase
        .from('messages')
        .select('id, content, created_at, users(first_name)')
        .order('created_at', { ascending: false })
        .limit(10)
        .lt('id', lastMessageId);  // Load messages older than the last loaded one

    // If currentChatroomId is not set (general chatroom), fetch messages with chatroom_id IS NULL
    if (currentChatroomId === null) {
        query = query.is('chatroom_id', null);  // Use `is` to handle NULL
    } else {
        query = query.eq('chatroom_id', currentChatroomId);  // Specific chatroom
    }

    const { data: messages, error } = await query;

    if (error) {
        console.error('Error fetching messages:', error);
        return;
    }

    const messagesDisplay = document.getElementById('messages');

    // Append the older messages to the feed
    messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');

        if (message.users.first_name === currentUser.first_name) {
            messageElement.classList.add('you');
        }

        const formattedDate = formatPostDate(message.created_at);

        let contentHtml = '';

        try {
            // Attempt to parse the content as JSON
            const messageData = JSON.parse(message.content);

            if (messageData.image_url) {
                // If there is an image URL in the JSON, display the image
                contentHtml += `<img src="${messageData.image_url}" alt="Image" style="max-width: 200px; display: block; margin-bottom: 10px;">`;
            }

            if (messageData.content) {
                // If there is text content in the JSON, display it under the image
                contentHtml += `<p>${messageData.content}</p>`;
            }
        } catch (e) {
            // If parsing fails, the content is not JSON, handle it as a string
            if (isImageUrl(message.content)) {
                // If the content is an image URL, display the image
                contentHtml = `<img src="${message.content}" alt="Image" style="max-width: 200px; display: block; margin-bottom: 10px;">`;
            } else if (isSingleEmoji(message.content)) {
                // If it's a single emoji, display it with special formatting
                contentHtml = `<p style="font-size: 3em; margin: 0;">${message.content}</p>`;
            } else {
                // Otherwise, treat it as regular text content
                contentHtml = `<p>${message.content}</p>`;
            }
        }

        // Create the final message structure with the message content
        messageElement.innerHTML = `
        <div class="message-author">
            ${message.users.first_name} <span style="font-size: smaller; color: #888;">${formattedDate}</span>
        </div>
        <div class="message-content" style="max-width: 200px;">${contentHtml}</div>
        `;

        // If it's the current user's message, add right-click/long press event for deletion
        if (message.users.first_name === currentUser.first_name) {
            // Right-click for desktop
            messageElement.addEventListener('contextmenu', function (event) {
                event.preventDefault();
                confirmDelete(message.id, messageElement);
            });

            // Long-press for mobile (optional)
            let pressTimer;
            messageElement.addEventListener('touchstart', function (event) {
                pressTimer = setTimeout(() => confirmDelete(message.id, messageElement), 800); // Long press triggers after 800ms
            });

            messageElement.addEventListener('touchend', function () {
                clearTimeout(pressTimer); // Cancel long press if touch ends before 800ms
            });
        }

        messagesDisplay.appendChild(messageElement);
    });
    // Update lastMessageId to the **oldest message ID** in the newly fetched batch
    if (messages.length > 0) {
        lastMessageId = messages[messages.length - 1].id;  // Oldest message ID
    }
}

