document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarToggleMain = document.getElementById('sidebar-toggle-main');
    const pageTitle = document.getElementById('page-title');

    const csvUpload = document.getElementById('csv-upload');
    const imageUpload = document.getElementById('image-upload');
    const manualMessageInput = document.getElementById('manual-message');
    const whatsappTypeOptions = document.getElementById('whatsapp-type-options');
    const whatsappTypeApi = document.querySelector('input[name="whatsapp-type"][value="api"]');
    const scheduleDateInput = document.getElementById('schedule-date');
    const scheduleTimeInput = document.getElementById('schedule-time');
    const generateButton = document.getElementById('generate-button');
    const scheduleButton = document.getElementById('schedule-button');

    const customerTableContainer = document.getElementById('customer-table-container');
    const messagePreviewContainer = document.getElementById('message-preview-container');
    const messageLogContainer = document.getElementById('message-log-container');

    const whatsappApiTokenInput = document.getElementById('whatsapp-api-token');
    const whatsappPhoneNumberIdInput = document.getElementById('whatsapp-phone-id');
    const emailApiKeyInput = document.getElementById('email-api-key');
    const emailSenderInput = document.getElementById('email-sender');

    const alertMessage = document.getElementById('alert-message');
    const alertText = document.getElementById('alert-text');
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modal-message');
    const closeModalButton = document.getElementById('close-modal');
    const qrModal = document.getElementById('qr-modal');
    const closeQrModalButton = document.getElementById('close-qr-modal');
    const qrCodeContainer = document.getElementById('qr-code-container');

    const menuLinks = document.querySelectorAll('aside nav a');
    const dashboardSections = document.querySelectorAll('.dashboard-section');

    // State variables
    let customerData = [];
    let generatedMessages = [];
    let uploadedImage = null;
    let messageLog = [];
    let currentMessageType = 'whatsapp'; // Default to WhatsApp for the composer

    // --- Utility Functions ---
    // Function to display alerts
    const showAlert = (message, type = 'error') => {
        alertText.textContent = message;
        if (type === 'error') {
            alertMessage.classList.remove('bg-green-100', 'border-green-400', 'text-green-700');
            alertMessage.classList.add('bg-red-100', 'border-red-400', 'text-red-700');
        } else {
            alertMessage.classList.remove('bg-red-100', 'border-red-400', 'text-green-700');
            alertMessage.classList.add('bg-green-100', 'border-green-400', 'text-green-700');
        }
        alertMessage.classList.remove('hidden');
    };

    // Function to hide alerts
    const hideAlert = () => {
        alertMessage.classList.add('hidden');
    };

    // Function to show the modal
    const showModal = (message) => {
        modalMessage.textContent = message;
        modal.classList.remove('hidden');
    };

    // Function to hide the modal
    const hideModal = () => {
        modal.classList.add('hidden');
    };
    
    // Function to show the QR modal
    const showQrModal = () => {
        qrModal.classList.remove('hidden');
    };

    // Function to hide the QR modal
    const hideQrModal = () => {
        qrModal.classList.add('hidden');
    };

    // Function to switch between dashboard sections
    const showSection = (sectionId, title) => {
        dashboardSections.forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(sectionId).classList.remove('hidden');
        pageTitle.textContent = title;
    };

    // Function to highlight the active menu link
    const setActiveLink = (element) => {
        menuLinks.forEach(link => {
            link.classList.remove('active-link');
        });
        element.classList.add('active-link');
    };

    // Initial setup: Show the dashboard section by default
    showSection('section-dashboard', 'Dashboard');
    setActiveLink(document.getElementById('menu-dashboard'));

    // --- Event Listeners for UI interaction ---
    // Event listener for the close modal button
    closeModalButton.addEventListener('click', hideModal);
    closeQrModalButton.addEventListener('click', hideQrModal);

    // Sidebar toggle for mobile
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
        sidebarOverlay.classList.toggle('hidden');
    });

    sidebarToggleMain.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
        sidebarOverlay.classList.toggle('hidden');
    });

    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
    });

    // Navigation menu link click handlers
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetElement = e.currentTarget;
            if (!targetElement) return;

            const sectionId = targetElement.id.replace('menu-', 'section-');
            const title = targetElement.dataset.title;

            hideAlert(); // Hide any existing alerts

            switch (sectionId) {
                case 'section-whatsapp':
                case 'section-email':
                case 'section-sms':
                    showSection('section-composer', title);
                    currentMessageType = title.toLowerCase();
                    // Toggle WhatsApp specific options
                    whatsappTypeOptions.classList.toggle('hidden', currentMessageType !== 'whatsapp');
                    break;
                case 'section-customers':
                    showSection('section-customers', title);
                    renderCustomerData(); // Ensure table is rendered or placeholder is shown
                    break;
                case 'section-preview':
                    showSection('section-preview', title);
                    renderMessagePreview(); // Ensure preview is rendered or placeholder is shown
                    break;
                case 'section-dashboard':
                    showSection('section-dashboard', title);
                    break;
                case 'section-settings':
                    showSection('section-settings', title);
                    break;
            }
            
            setActiveLink(targetElement);
            // Hide sidebar on mobile after clicking a link
            if (window.innerWidth < 768) {
                sidebar.classList.add('-translate-x-full');
                sidebarOverlay.classList.add('hidden');
            }
        });
    });

    // --- Core Application Logic ---
    // Function to parse CSV text into an array of objects
    const parseCsv = (csvText) => {
        const lines = csvText.trim().split('\n');
        if (lines.length === 0) return [];
        const headers = lines[0].split(',').map(header => header.trim());
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(value => value.trim());
            if (values.length === headers.length) {
                let obj = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index];
                });
                data.push(obj);
            }
        }
        return data;
    };

    // Function to render the customer data table
    const renderCustomerData = () => {
        if (customerData.length === 0) {
            customerTableContainer.innerHTML = `<p class="text-gray-500 text-center py-8">No customer data available.</p>`;
            return;
        }

        const headers = Object.keys(customerData[0]);
        const tableHtml = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        ${headers.map(key => `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${key}</th>`).join('')}
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${customerData.map(customer => `
                        <tr>
                            ${Object.values(customer).map(value => `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${value}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        customerTableContainer.innerHTML = tableHtml;
    };

    // Function to render the message preview
    const renderMessagePreview = () => {
        if (generatedMessages.length === 0) {
            messagePreviewContainer.innerHTML = `<p class="text-gray-500 text-center py-8">Generate messages to see a preview here.</p>`;
            return;
        }

        const previewHtml = generatedMessages.map(msg => `
            <div class="bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition duration-150 ease-in-out">
                <p class="text-sm font-medium text-gray-500">To: ${msg.customer.name || msg.customer.email || 'Unknown Customer'}</p>
                ${msg.image ? `<img src="${msg.image}" alt="Message image" class="mt-2 rounded-md max-h-48 object-cover">` : ''}
                <p class="mt-2 text-gray-800 leading-relaxed">${msg.content}</p>
            </div>
        `).join('');
        messagePreviewContainer.innerHTML = previewHtml;
    };

    // Function to update the message log
    const updateMessageLog = (log) => {
        messageLog.push(log);
        renderMessageLog();
    };

    // Function to render the message log table
    const renderMessageLog = () => {
        if (messageLog.length === 0) {
            messageLogContainer.innerHTML = `<p class="text-gray-500">Messages sent will appear here.</p>`;
            return;
        }
        const tableHtml = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3">Recipient</th>
                        <th class="px-6 py-3">Type</th>
                        <th class="px-6 py-3">Status</th>
                        <th class="px-6 py-3">Timestamp</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${messageLog.map(log => `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${log.recipient}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${log.type}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span class="${log.status === 'Success' ? 'success-badge' : 'failure-badge'}">
                                    ${log.status}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(log.timestamp).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        messageLogContainer.innerHTML = tableHtml;
    };


    // Event listener for CSV file upload
    csvUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'text/csv') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                try {
                    customerData = parseCsv(text);
                    hideAlert();
                    renderCustomerData();
                    showSection('section-customers', 'Customer Data');
                    setActiveLink(document.getElementById('menu-customers'));
                } catch (err) {
                    showAlert('Failed to parse CSV file. Please check the format.');
                    customerData = [];
                    customerTableContainer.innerHTML = `<p class="text-gray-500 text-center py-8">Upload a CSV to see customer data here.</p>`;
                }
            };
            reader.readAsText(file);
        } else {
            showAlert('Please upload a valid CSV file.');
            customerData = [];
            customerTableContainer.innerHTML = `<p class="text-gray-500 text-center py-8">Upload a CSV to see customer data here.</p>`;
        }
    });

    // Event listener for image file upload
    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImage = e.target.result; // Store Base64 data
            };
            reader.readAsDataURL(file);
        } else {
            uploadedImage = null;
        }
    });

    // Event listener for "Generate Messages" button
    generateButton.addEventListener('click', () => {
        const manualMessage = manualMessageInput.value;
        if (customerData.length === 0) {
            showAlert('Please upload customer data first.');
            return;
        }
        if (!manualMessage) {
            showAlert('Please write a message to send.');
            return;
        }

        hideAlert();
        generatedMessages = [];

        customerData.forEach(customer => {
            let personalizedMessage = manualMessage;
            Object.keys(customer).forEach(key => {
                const placeholder = new RegExp(`\\[${key}\\]`, 'g');
                personalizedMessage = personalizedMessage.replace(placeholder, customer[key]);
            });
            generatedMessages.push({
                customer: customer,
                content: personalizedMessage,
                image: uploadedImage // Include image data
            });
        });

        renderMessagePreview();
        showSection('section-preview', 'Message Preview');
        setActiveLink(document.getElementById('menu-preview'));
    });

    // Event listener for "Schedule Messages" button
    scheduleButton.addEventListener('click', () => {
        if (generatedMessages.length === 0) {
            showAlert('Please generate messages first.');
            return;
        }

        const scheduledDate = scheduleDateInput.value;
        const scheduledTime = scheduleTimeInput.value;
        const messageType = currentMessageType;
        const whatsappType = messageType === 'whatsapp' ? document.querySelector('input[name="whatsapp-type"]:checked').value : null;

        if (!scheduledDate || !scheduledTime) {
            showAlert('Please select a date and time.');
            return;
        }

        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        if (scheduledDateTime < new Date()) {
            showAlert('Cannot schedule messages in the past.');
            return;
        }

        // Handle QR Code flow separately
        if (messageType === 'whatsapp' && whatsappType === 'qr_code') {
            const messageContent = generatedMessages[0]?.content;
            if (!messageContent) {
                showAlert('No message content available to generate a QR code.');
                return;
            }
            const dataToEncode = `https://wa.me/?text=${encodeURIComponent(messageContent)}`;
            
            qrCodeContainer.innerHTML = ''; // Clear previous QR code
            new QRCode(qrCodeContainer, {
                text: dataToEncode,
                width: 256,
                height: 256,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });

            showQrModal();
            return; // Exit the function to prevent API call
        }

        // Check for API credentials
        if (messageType === 'whatsapp' && whatsappType === 'api' && (!whatsappApiTokenInput.value || !whatsappPhoneNumberIdInput.value)) {
            showAlert('Please enter WhatsApp API credentials in the settings.');
            return;
        }
        if (messageType === 'email' && (!emailApiKeyInput.value || !emailSenderInput.value)) {
            showAlert('Please enter Email API credentials in the settings.');
            return;
        }

        // Simulate a successful API response
        showModal('Messages have been successfully scheduled.');
        generatedMessages.forEach(msg => {
             updateMessageLog({
                 recipient: msg.customer.name || msg.customer.email,
                 type: messageType,
                 status: 'Success',
                 timestamp: new Date().toISOString()
             });
        });
            
        showSection('section-dashboard', 'Dashboard');
        setActiveLink(document.getElementById('menu-dashboard'));

    });
});
