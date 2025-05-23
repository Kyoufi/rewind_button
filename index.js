(function() {
    'use strict';

    // --- Configuration ---
    const REWIND_BUTTON_ICON_CLASS = 'fa-solid fa-rotate-left'; // Font Awesome icon class
    const REWIND_BUTTON_TEXT = 'Rewind'; // Text next to the icon
    const REWIND_BUTTON_TOOLTIP = 'Rewind chat to this message (deletes all messages below)';
    const CUSTOM_BUTTON_CLASS = 'st-rewind-button'; // Custom class for easier selection/styling

    // --- Helper: Display Status/Notification ---
    // This is a basic notification. Ideally, integrate with SillyTavern's toast/notification system if available.
    function displayNotification(message, type = 'info', duration = 4000) {
        console.log(`[RewindExt] ${type.toUpperCase()}: ${message}`);
        let notificationBox = document.getElementById('rewind-ext-notification-box');
        if (!notificationBox) {
            notificationBox = document.createElement('div');
            notificationBox.id = 'rewind-ext-notification-box';
            Object.assign(notificationBox.style, {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                padding: '12px 18px',
                borderRadius: '6px',
                zIndex: '10001', // High z-index
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'opacity 0.5s, transform 0.5s',
                opacity: '0',
                transform: 'translateY(20px)'
            });
            document.body.appendChild(notificationBox);
        }

        notificationBox.textContent = message;
        switch (type) {
            case 'success':
                notificationBox.style.backgroundColor = '#e6fffa'; // Light green
                notificationBox.style.color = '#007a5a';
                notificationBox.style.borderLeft = '4px solid #00c853';
                break;
            case 'error':
                notificationBox.style.backgroundColor = '#ffebee'; // Light red
                notificationBox.style.color = '#c62828';
                notificationBox.style.borderLeft = '4px solid #e53935';
                break;
            default: // info
                notificationBox.style.backgroundColor = '#e3f2fd'; // Light blue
                notificationBox.style.color = '#1565c0';
                notificationBox.style.borderLeft = '4px solid #2196f3';
                break;
        }

        // Animate in
        requestAnimationFrame(() => {
            notificationBox.style.opacity = '1';
            notificationBox.style.transform = 'translateY(0)';
        });

        // Clear previous timeout if any
        if (notificationBox.currentTimeout) {
            clearTimeout(notificationBox.currentTimeout);
        }

        notificationBox.currentTimeout = setTimeout(() => {
            notificationBox.style.opacity = '0';
            notificationBox.style.transform = 'translateY(20px)';
            // Optional: remove after fade out if not reusing element often
            // setTimeout(() => { if(notificationBox.style.opacity === '0') notificationBox.remove(); }, 500);
        }, duration);
    }


    // --- Core Rewind Logic ---
    async function handleRewindClick(event) {
        event.stopPropagation(); // Prevent other click events on the message
        const button = event.currentTarget;
        const messageBlock = button.closest('.mes'); // .mes is the standard class for message blocks in ST

        if (!messageBlock) {
            console.error('[RewindExt] Could not find parent message block.');
            displayNotification('Error: Could not identify message for rewind.', 'error');
            return;
        }

        const messageIdString = messageBlock.getAttribute('mesid'); // 'mesid' usually stores the index in the `chat` array
        if (messageIdString === null) {
            console.error('[RewindExt] Message block is missing the "mesid" attribute.');
            displayNotification('Error: Message ID attribute not found.', 'error');
            return;
        }
        const targetChatIndex = parseInt(messageIdString);

        // Validate core SillyTavern variables/functions
        if (typeof chat === 'undefined' || !Array.isArray(chat)) {
            console.error('[RewindExt] Global `chat` array is not available or not an array.');
            displayNotification('Error: Chat data is not accessible.', 'error');
            return;
        }
        if (typeof deleteMessage !== 'function') {
            console.error('[RewindExt] Global `deleteMessage` function is not available.');
            displayNotification('Error: Message deletion function is not accessible.', 'error');
            return;
        }
        if (typeof saveChat !== 'function') {
            console.error('[RewindExt] Global `saveChat` function is not available.');
            displayNotification('Error: Chat saving function is not accessible.', 'error');
            return;
        }

        if (isNaN(targetChatIndex) || targetChatIndex < 0 || targetChatIndex >= chat.length) {
            console.error('[RewindExt] Invalid message index:', targetChatIndex, 'Chat length:', chat.length);
            displayNotification('Error: Invalid message index for rewind.', 'error');
            return;
        }

        const messagesToDeleteCount = chat.length - (targetChatIndex + 1);

        if (messagesToDeleteCount <= 0) {
            displayNotification('This is the last message, or there are no messages below it to rewind.', 'info');
            return;
        }

        // Confirmation Dialog
        if (!confirm(`Are you sure you want to rewind to this point?\n\nThis will permanently delete ${messagesToDeleteCount} message(s) below the selected message. The selected message will remain.`)) {
            return; // User cancelled
        }

        console.log(`[RewindExt] User confirmed. Rewinding chat. Target index: ${targetChatIndex}. Messages to delete: ${messagesToDeleteCount}`);
        button.disabled = true;
        const originalButtonContent = button.innerHTML;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Rewinding...`;

        try {
            let successfullyDeletedCount = 0;
            // Delete messages from the end of the chat array backwards, down to the one AFTER the targetChatIndex
            for (let i = chat.length - 1; i > targetChatIndex; i--) {
                // `deleteMessage(index_in_chat_array, silent_boolean, force_this_swipe_deletion_boolean)`
                // This function should handle removing from `chat` array and updating the DOM.
                await deleteMessage(i, true, true); // silent = true, force = true
                successfullyDeletedCount++;
            }

            // After all deletions, save the chat state
            await saveChat();

            displayNotification(`${successfullyDeletedCount} message(s) deleted. Chat successfully rewound.`, 'success');
            console.log(`[RewindExt] ${successfullyDeletedCount} message(s) deleted successfully.`);

            // The UI should ideally update automatically after `deleteMessage` and `saveChat`.
            // If not, a manual re-render might be needed, e.g., by calling a function like `printMessages()` or `constructChat()`.
            // This depends heavily on the specific SillyTavern version.

        } catch (error) {
            console.error('[RewindExt] Error during rewind operation:', error);
            displayNotification(`Error during rewind: ${error.message}`, 'error');
        } finally {
            // Re-enable button if it still exists in the DOM
            if (button && document.body.contains(button)) {
                button.disabled = false;
                button.innerHTML = originalButtonContent;
            }
        }
    }

    // --- Button Creation and Injection ---
    function addRewindButtonToMessage(messageElement) {
        // `mes_buttons` is a common container for action buttons on a message.
        let actionsContainer = messageElement.querySelector('.mes_buttons');

        if (!actionsContainer) {
            // If .mes_buttons doesn't exist, some ST versions might place buttons elsewhere or not have this container.
            // As a fallback, we could try to create it or append to another known element,
            // but it's safer to skip if the standard structure isn't found.
            // console.warn('[RewindExt] .mes_buttons container not found in message:', messageElement);
            return;
        }

        // Prevent adding duplicate buttons
        if (actionsContainer.querySelector(`.${CUSTOM_BUTTON_CLASS}`)) {
            return;
        }

        const rewindButton = document.createElement('div'); // ST action buttons are often divs styled as buttons
        rewindButton.className = `mes_button ${CUSTOM_BUTTON_CLASS}`; // Use ST's base button style + custom class
        rewindButton.title = REWIND_BUTTON_TOOLTIP;

        // Set button content (icon + text)
        rewindButton.innerHTML = `<i class="${REWIND_BUTTON_ICON_CLASS}"></i> ${REWIND_BUTTON_TEXT}`;

        rewindButton.addEventListener('click', handleRewindClick);

        // Append the new button to the actions container
        actionsContainer.appendChild(rewindButton);
    }

    // --- Process Existing and New Messages ---
    function processAllMessages() {
        const messageElements = document.querySelectorAll('#chat .mes'); // #chat is the main chat container
        messageElements.forEach(msgElement => {
            // Ensure it's a message that should have actions (e.g., has a 'mesid')
            if (msgElement.getAttribute('mesid') !== null) {
                addRewindButtonToMessage(msgElement);
            }
        });
    }

    // Observe for new messages being added to the chat
    function observeChatContainer() {
        const chatContainer = document.getElementById('chat');
        if (!chatContainer) {
            console.error('[RewindExt] Chat container #chat not found. Extension cannot monitor new messages.');
            displayNotification('Error: Chat container not found. Rewind extension may not work correctly for new messages.', 'error');
            return;
        }

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        // Check if the added node itself is a message
                        if (node.nodeType === Node.ELEMENT_NODE && node.matches && node.matches('.mes') && node.getAttribute('mesid') !== null) {
                            addRewindButtonToMessage(node);
                        }
                        // Also check if the added node contains messages (e.g., a batch of messages loaded)
                        else if (node.nodeType === Node.ELEMENT_NODE && node.querySelectorAll) {
                            node.querySelectorAll('.mes').forEach(childMsg => {
                                if (childMsg.getAttribute('mesid') !== null) {
                                    addRewindButtonToMessage(childMsg);
                                }
                            });
                        }
                    });
                }
            });
        });

        observer.observe(chatContainer, { childList: true, subtree: true });
        console.log('[RewindExt] Observer attached to #chat for new messages.');
    }

    // --- Initialization ---
    function initializeExtension() {
        console.log('[RewindExt] Initializing SillyTavern Rewind Action Extension...');

        // Add some basic styling for the button (adjust as needed)
        const style = document.createElement('style');
        style.textContent = `
            .${CUSTOM_BUTTON_CLASS} {
                /* Inherits .mes_button styles. Add specifics if needed: */
                /* e.g., color: #yourColor; */
            }
            .${CUSTOM_BUTTON_CLASS} i {
                margin-right: 5px; /* Space between icon and text */
            }
        `;
        document.head.appendChild(style);

        // Process messages already on the page
        processAllMessages();

        // Start observing for new messages
        observeChatContainer();

        displayNotification('Rewind Action Extension Loaded.', 'success', 2000);
        console.log('[RewindExt] Extension loaded and observing chat.');
    }

    // Wait for SillyTavern's core components to be ready.
    // A simple check for `chat` array and `deleteMessage` function.
    // More robust checks might involve specific ST events or elements.
    function waitForSillyTavern(callback) {
        const maxRetries = 60; // Try for ~30 seconds
        let retries = 0;
        const interval = setInterval(() => {
            if (typeof chat !== 'undefined' && typeof deleteMessage === 'function' && typeof saveChat === 'function' && document.getElementById('chat') && document.querySelector('#chat .mes .mes_buttons')) {
                clearInterval(interval);
                callback();
            } else {
                retries++;
                if (retries >= maxRetries) {
                    clearInterval(interval);
                    console.error('[RewindExt] SillyTavern did not initialize in time or key elements/functions are missing. Extension might not work correctly.');
                    displayNotification('Error: SillyTavern not fully loaded. Rewind extension may be non-functional.', 'error', 6000);
                }
            }
        }, 500);
    }

    // --- Entry Point ---
    // Ensure DOM is ready before trying to access elements
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => waitForSillyTavern(initializeExtension));
    } else {
        waitForSillyTavern(initializeExtension);
    }

})();
