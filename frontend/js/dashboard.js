// Dashboard Navigation
document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            navButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');

            // Hide all sections
            document.querySelectorAll('.dashboard-section').forEach(section => {
                section.classList.add('hidden');
            });

            // Show selected section
            const sectionId = `${button.dataset.section}-section`;
            document.getElementById(sectionId).classList.remove('hidden');
        });
    });
});

// Advocate Dashboard
function initializeAdvocateDashboard() {
    loadCases();
    setupCaseForm();
    setupDocumentUpload();
    setupCaseSearch();
    setupCalendarControls();
    loadHearings();
}

async function loadCases() {
    try {
        const cases = await api.getCases();
        const casesList = document.getElementById('cases-list');
        casesList.innerHTML = cases.map(case_ => `
            <div class="case-card">
                <h3>Case #${case_.caseNumber}</h3>
                <p><strong>Client:</strong> ${case_.clientId.fullName}</p>
                <p><strong>Type:</strong> ${case_.caseType}</p>
                <p><strong>Status:</strong> ${case_.status}</p>
                <p><strong>Next Hearing:</strong> ${new Date(case_.nextHearingDate).toLocaleDateString()}</p>
                <button onclick="viewCaseDetails('${case_._id}')">View Details</button>
            </div>
        `).join('');
    } catch (error) {
        alert('Error loading cases: ' + error.message);
    }
}

function setupCaseForm() {
    const addCaseBtn = document.getElementById('add-case-btn');
    addCaseBtn.addEventListener('click', () => {
        const formHtml = `
            <div id="case-form" class="modal">
                <div class="modal-content">
                    <h2>Add New Case</h2>
                    <form id="new-case-form">
                        <div class="form-group">
                            <label for="caseNumber">Case Number</label>
                            <input type="text" id="caseNumber" required>
                        </div>
                        <div class="form-group">
                            <label for="clientId">Client Email</label>
                            <input type="email" id="clientEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="caseType">Case Type</label>
                            <select id="caseType" required>
                                <option value="">Select Case Type</option>
                                <option value="Civil">Civil</option>
                                <option value="Criminal">Criminal</option>
                                <option value="Family">Family</option>
                                <option value="Corporate">Corporate</option>
                                <option value="Property">Property</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="description">Description</label>
                            <textarea id="description" required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="nextHearingDate">Next Hearing Date</label>
                            <input type="date" id="nextHearingDate" required>
                        </div>
                        <div class="form-buttons">
                            <button type="submit">Create Case</button>
                            <button type="button" onclick="document.getElementById('case-form').remove()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', formHtml);

        document.getElementById('new-case-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const clientEmail = document.getElementById('clientEmail').value;
            
            try {
                // First, get the client's ID using their email
                const response = await fetch(`${API_URL}/auth/find-user-by-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${api.token}`
                    },
                    body: JSON.stringify({ email: clientEmail })
                });
                
                const userData = await response.json();
                if (!userData.user || userData.user.role !== 'client') {
                    throw new Error('Invalid client email or user is not a client');
                }

                const caseData = {
                    caseNumber: document.getElementById('caseNumber').value,
                    clientId: userData.user._id,
                    caseType: document.getElementById('caseType').value,
                    description: document.getElementById('description').value,
                    nextHearingDate: document.getElementById('nextHearingDate').value
                };

                await api.createCase(caseData);
                document.getElementById('case-form').remove();
                loadCases();
                alert('Case created successfully!');
            } catch (error) {
                alert('Error creating case: ' + error.message);
            }
        });
    });
}

function setupDocumentUpload() {
    const uploadForm = document.getElementById('document-upload-form');
    const caseSelect = document.getElementById('case-select');

    // Add label and placeholder option
    caseSelect.innerHTML = `
        <option value="">Select Case</option>
    `;

    // Populate cases in the dropdown
    api.getCases().then(cases => {
        cases.forEach(case_ => {
            const option = document.createElement('option');
            option.value = case_._id;
            option.textContent = `Case #${case_.caseNumber} - ${case_.clientId.fullName}`;
            caseSelect.appendChild(option);
        });
    }).catch(error => {
        alert('Error loading cases: ' + error.message);
    });

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            caseId: document.getElementById('case-select').value,
            title: document.getElementById('document-title').value,
            description: document.getElementById('document-description').value,
            fileUrl: 'temp-url', // In a real app, you would upload to a storage service first
            fileType: document.getElementById('document-file').files[0].type
        };

        try {
            await api.uploadDocument(formData);
            uploadForm.reset();
            alert('Document uploaded successfully');
        } catch (error) {
            alert('Error uploading document: ' + error.message);
        }
    });
}

async function loadHearings() {
    try {
        const hearings = await api.getAdvocateHearings();
        const hearingsList = document.getElementById('hearings-list');
        hearingsList.innerHTML = hearings.map(hearing => `
            <div class="hearing-card">
                <h3>Case #${hearing.caseNumber}</h3>
                <p><strong>Client:</strong> ${hearing.clientId.fullName}</p>
                <p><strong>Date:</strong> ${new Date(hearing.nextHearingDate).toLocaleDateString()}</p>
                <button onclick="updateHearing('${hearing._id}')">Update Date</button>
            </div>
        `).join('');
    } catch (error) {
        alert('Error loading hearings: ' + error.message);
    }
}

// Client Dashboard
function initializeClientDashboard() {
    const caseLookupForm = document.getElementById('case-lookup-form');
    loadClientHearings(); // Load hearings immediately when dashboard initializes

    caseLookupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const caseNumber = document.getElementById('case-number').value;

        try {
            const response = await fetch(`${API_URL}/cases/by-number/${caseNumber}`, {
                headers: {
                    'Authorization': `Bearer ${api.token}`
                }
            });
            const data = await response.json();
            
            if (!data.case) {
                throw new Error('Case not found');
            }

            displayClientCaseDetails(data.case);
            loadClientDocuments(data.case._id);
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
}

function displayClientCaseDetails(case_) {
    const detailsDiv = document.getElementById('client-case-details');
    detailsDiv.innerHTML = `
        <div class="case-details">
            <h2>Case Details</h2>
            <p><strong>Case Number:</strong> ${case_.caseNumber}</p>
            <p><strong>Type:</strong> ${case_.caseType}</p>
            <p><strong>Status:</strong> ${case_.status}</p>
            <p><strong>Description:</strong> ${case_.description}</p>
            <p><strong>Advocate:</strong> ${case_.advocateId.fullName}</p>
            <p><strong>Next Hearing:</strong> ${new Date(case_.nextHearingDate).toLocaleDateString()}</p>
        </div>
    `;
    
    // Show the document upload form when case details are displayed
    const uploadForm = document.getElementById('client-document-upload');
    uploadForm.classList.remove('hidden');
    setupClientDocumentUpload(case_._id);
}

function setupClientDocumentUpload(caseId) {
    const uploadForm = document.getElementById('client-document-upload-form');
    
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            caseId: caseId,
            title: document.getElementById('client-document-title').value,
            description: document.getElementById('client-document-description').value,
            fileUrl: 'temp-url', // In a real app, you would upload to a storage service first
            fileType: document.getElementById('client-document-file').files[0].type
        };

        try {
            await api.uploadDocument(formData);
            uploadForm.reset();
            alert('Document uploaded successfully');
            // Refresh the documents list
            loadClientDocuments(caseId);
        } catch (error) {
            alert('Error uploading document: ' + error.message);
        }
    });
}

async function loadClientDocuments(caseId) {
    try {
        const documents = await api.getCaseDocuments(caseId);
        const documentsDiv = document.getElementById('client-documents-list');
        documentsDiv.innerHTML = `
            <h2>Case Documents</h2>
            ${documents.map(doc => `
                <div class="document-card">
                    <h3>${doc.title}</h3>
                    <p>${doc.description || 'No description'}</p>
                    <p>Uploaded on: ${new Date(doc.uploadDate).toLocaleDateString()}</p>
                    <p><strong>Uploaded by:</strong> ${doc.uploadedBy.role === 'client' ? 'You' : 'Advocate'}</p>
                    <a href="${doc.fileUrl}" target="_blank">View Document</a>
                </div>
            `).join('')}
        `;
    } catch (error) {
        alert('Error loading documents: ' + error.message);
    }
}

async function loadClientHearings() {
    try {
        const hearings = await api.getClientHearings();
        const hearingsDiv = document.getElementById('client-hearings');
        hearingsDiv.innerHTML = `
            <h2>Your Upcoming Hearings</h2>
            <div class="hearings-grid">
                ${hearings.map(hearing => `
                    <div class="hearing-card">
                        <h3>Case #${hearing.caseNumber}</h3>
                        <p><strong>Type:</strong> ${hearing.caseType}</p>
                        <p><strong>Next Hearing:</strong> ${new Date(hearing.nextHearingDate).toLocaleDateString()}</p>
                        <p><strong>Advocate:</strong> ${hearing.advocateId.fullName}</p>
                        <p class="status ${hearing.status.toLowerCase()}">${hearing.status}</p>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        alert('Error loading hearings: ' + error.message);
    }
}

// Utility Functions
async function viewCaseDetails(caseId) {
    try {
        const case_ = await api.getCase(caseId);
        const documents = await api.getCaseDocuments(caseId);
        
        const detailsHtml = `
            <div id="case-details-modal" class="modal">
                <div class="modal-content large-modal">
                    <div class="modal-header">
                        <div class="header-content">
                            <h2>Case #${case_.caseNumber}</h2>
                            <span class="status ${case_.status.toLowerCase()}">${case_.status}</span>
                        </div>
                        <button onclick="document.getElementById('case-details-modal').remove()" class="close-btn">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="details-section">
                            <h3>Case Information</h3>
                            <div class="details-grid">
                                <div class="detail-group">
                                    <label>Client Name</label>
                                    <p>${case_.clientId.fullName}</p>
                                </div>
                                <div class="detail-group">
                                    <label>Client Email</label>
                                    <p>${case_.clientId.email}</p>
                                </div>
                                <div class="detail-group">
                                    <label>Case Type</label>
                                    <p>${case_.caseType}</p>
                                </div>
                                <div class="detail-group">
                                    <label>Filing Date</label>
                                    <p>${new Date(case_.filingDate).toLocaleDateString()}</p>
                                </div>
                                <div class="detail-group">
                                    <label>Next Hearing</label>
                                    <p>${new Date(case_.nextHearingDate).toLocaleDateString()}</p>
                                </div>
                                <div class="detail-group">
                                    <label>Status</label>
                                    <p>${case_.status}</p>
                                </div>
                            </div>
                            
                            <div class="description-section">
                                <h3>Case Description</h3>
                                <p class="description-text">${case_.description}</p>
                            </div>
                        </div>

                        <div class="documents-section">
                            <div class="section-header">
                                <h3>Case Documents</h3>
                                <button onclick="showUploadForm('${caseId}')" class="btn-secondary">Upload New Document</button>
                            </div>
                            <div class="documents-grid">
                                ${documents.length === 0 ? 
                                    '<p class="no-documents">No documents uploaded yet</p>' :
                                    documents.map(doc => `
                                        <div class="document-card">
                                            <div class="document-header">
                                                <div class="document-icon">📄</div>
                                                <div class="document-title">
                                                    <h4>${doc.title}</h4>
                                                    <span class="document-type">${doc.fileType}</span>
                                                </div>
                                            </div>
                                            <div class="document-details">
                                                <p>${doc.description || 'No description provided'}</p>
                                                <div class="document-meta">
                                                    <span>Uploaded: ${new Date(doc.uploadDate).toLocaleDateString()}</span>
                                                    <span>By: ${doc.uploadedBy.role === 'client' ? 'Client' : 'Advocate'}</span>
                                                </div>
                                            </div>
                                            <div class="document-actions">
                                                <a href="${doc.fileUrl}" target="_blank" class="btn-primary">View Document</a>
                                                ${doc.uploadedBy.role === case_.advocateId.role ? 
                                                    `<button onclick="deleteDocument('${doc._id}')" class="btn-danger">Delete</button>` : 
                                                    ''}
                                            </div>
                                        </div>
                                    `).join('')
                                }
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button onclick="updateHearing('${caseId}')" class="btn-primary">Update Hearing Date</button>
                        <button onclick="document.getElementById('case-details-modal').remove()" class="btn-secondary">Close</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', detailsHtml);
    } catch (error) {
        alert('Error loading case details: ' + error.message);
    }
}

function showUploadForm(caseId) {
    const uploadFormHtml = `
        <div id="upload-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Upload New Document</h3>
                    <button onclick="document.getElementById('upload-modal').remove()" class="close-btn">&times;</button>
                </div>
                <form id="case-document-upload-form">
                    <div class="form-group">
                        <label>Document Title</label>
                        <input type="text" id="upload-document-title" required>
                    </div>
                    <div class="form-group">
                        <label>Document File</label>
                        <input type="file" id="upload-document-file" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="upload-document-description"></textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" class="btn-primary">Upload</button>
                        <button type="button" onclick="document.getElementById('upload-modal').remove()" class="btn-secondary">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', uploadFormHtml);

    document.getElementById('case-document-upload-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            caseId: caseId,
            title: document.getElementById('upload-document-title').value,
            description: document.getElementById('upload-document-description').value,
            fileUrl: 'temp-url', // In a real app, you would upload to a storage service first
            fileType: document.getElementById('upload-document-file').files[0].type
        };

        try {
            await api.uploadDocument(formData);
            document.getElementById('upload-modal').remove();
            viewCaseDetails(caseId); // Refresh the case details view
            alert('Document uploaded successfully');
        } catch (error) {
            alert('Error uploading document: ' + error.message);
        }
    });
}

async function updateHearing(caseId) {
    const newDate = prompt('Enter new hearing date (YYYY-MM-DD):');
    if (newDate) {
        try {
            await api.updateHearingDate(caseId, newDate);
            loadHearings();
        } catch (error) {
            alert('Error updating hearing date: ' + error.message);
        }
    }
}

function setupCaseSearch() {
    const searchForm = document.getElementById('case-search-form');
    
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const caseNumber = document.getElementById('search-case-number').value;
        const clientName = document.getElementById('search-client-name').value;
        const caseType = document.getElementById('search-case-type').value;
        
        try {
            const cases = await api.getCases();
            let filteredCases = cases;
            
            // Apply filters
            if (caseNumber) {
                filteredCases = filteredCases.filter(c => 
                    c.caseNumber.toLowerCase().includes(caseNumber.toLowerCase())
                );
            }
            if (clientName) {
                filteredCases = filteredCases.filter(c => 
                    c.clientId.fullName.toLowerCase().includes(clientName.toLowerCase())
                );
            }
            if (caseType) {
                filteredCases = filteredCases.filter(c => c.caseType === caseType);
            }
            
            displaySearchResults(filteredCases);
        } catch (error) {
            alert('Error searching cases: ' + error.message);
        }
    });
}

function displaySearchResults(cases) {
    const resultsDiv = document.getElementById('search-results');
    if (cases.length === 0) {
        resultsDiv.innerHTML = '<p class="no-results">No cases found matching your search criteria.</p>';
        return;
    }
    
    resultsDiv.innerHTML = cases.map(case_ => `
        <div class="search-result-card">
            <div class="case-header">
                <h3>Case #${case_.caseNumber}</h3>
                <span class="status ${case_.status.toLowerCase()}">${case_.status}</span>
            </div>
            <div class="case-content">
                <div class="case-info">
                    <div class="info-group">
                        <label>Client</label>
                        <p>${case_.clientId.fullName}</p>
                    </div>
                    <div class="info-group">
                        <label>Case Type</label>
                        <p>${case_.caseType}</p>
                    </div>
                    <div class="info-group">
                        <label>Next Hearing</label>
                        <p>${new Date(case_.nextHearingDate).toLocaleDateString()}</p>
                    </div>
                    <div class="info-group">
                        <label>Description</label>
                        <p>${case_.description}</p>
                    </div>
                </div>
                <div class="case-documents">
                    <h4>Case Documents</h4>
                    <div class="documents-list" id="documents-${case_._id}">
                        Loading documents...
                    </div>
                </div>
                <div class="case-actions">
                    <button onclick="viewCaseDetails('${case_._id}')" class="btn-primary">View Full Details</button>
                    <button onclick="updateHearing('${case_._id}')" class="btn-secondary">Update Hearing</button>
                </div>
            </div>
        </div>
    `).join('');

    // Load documents for each case
    cases.forEach(case_ => {
        loadCaseDocuments(case_._id);
    });
}

async function loadCaseDocuments(caseId) {
    try {
        const documents = await api.getCaseDocuments(caseId);
        const documentsDiv = document.getElementById(`documents-${caseId}`);
        if (!documents || documents.length === 0) {
            documentsDiv.innerHTML = '<p class="no-documents">No documents uploaded yet</p>';
            return;
        }

        documentsDiv.innerHTML = `
            <div class="documents-grid">
                ${documents.map(doc => `
                    <div class="document-item">
                        <div class="document-icon">📄</div>
                        <div class="document-info">
                            <h5>${doc.title}</h5>
                            <p class="document-meta">
                                <span>Uploaded: ${new Date(doc.uploadDate).toLocaleDateString()}</span>
                                <span>By: ${doc.uploadedBy.role === 'client' ? 'Client' : 'Advocate'}</span>
                            </p>
                        </div>
                        <a href="${doc.fileUrl}" target="_blank" class="btn-view">View</a>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        const documentsDiv = document.getElementById(`documents-${caseId}`);
        documentsDiv.innerHTML = '<p class="error">Error loading documents</p>';
    }
}

function setupCalendarControls() {
    const dateRange = document.getElementById('date-range');
    const hearingSearch = document.getElementById('hearing-search');
    
    dateRange.addEventListener('change', () => filterHearings());
    hearingSearch.addEventListener('input', () => filterHearings());
}

async function filterHearings() {
    const dateRange = document.getElementById('date-range').value;
    const searchTerm = document.getElementById('hearing-search').value.toLowerCase();
    
    try {
        const hearings = await api.getAdvocateHearings();
        let filteredHearings = hearings;
        
        // Apply date filter
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        switch(dateRange) {
            case 'today':
                filteredHearings = filteredHearings.filter(h => {
                    const hearingDate = new Date(h.nextHearingDate);
                    hearingDate.setHours(0, 0, 0, 0);
                    return hearingDate.getTime() === today.getTime();
                });
                break;
            case 'week':
                const weekEnd = new Date(today);
                weekEnd.setDate(today.getDate() + 7);
                filteredHearings = filteredHearings.filter(h => {
                    const hearingDate = new Date(h.nextHearingDate);
                    return hearingDate >= today && hearingDate <= weekEnd;
                });
                break;
            case 'month':
                const monthEnd = new Date(today);
                monthEnd.setMonth(today.getMonth() + 1);
                filteredHearings = filteredHearings.filter(h => {
                    const hearingDate = new Date(h.nextHearingDate);
                    return hearingDate >= today && hearingDate <= monthEnd;
                });
                break;
            case 'upcoming':
                filteredHearings = filteredHearings.filter(h => {
                    const hearingDate = new Date(h.nextHearingDate);
                    return hearingDate >= today;
                });
                break;
        }
        
        // Apply search filter
        if (searchTerm) {
            filteredHearings = filteredHearings.filter(h => 
                h.caseNumber.toLowerCase().includes(searchTerm) ||
                h.clientId.fullName.toLowerCase().includes(searchTerm)
            );
        }
        
        displayHearings(filteredHearings);
    } catch (error) {
        alert('Error filtering hearings: ' + error.message);
    }
}

function displayHearings(hearings) {
    const hearingsList = document.getElementById('hearings-list');
    if (hearings.length === 0) {
        hearingsList.innerHTML = '<p>No hearings found for the selected criteria.</p>';
        return;
    }
    
    hearingsList.innerHTML = hearings.map(hearing => `
        <div class="hearing-card">
            <h3>Case #${hearing.caseNumber}</h3>
            <div class="hearing-details">
                <p><strong>Client:</strong> ${hearing.clientId.fullName}</p>
                <p><strong>Type:</strong> ${hearing.caseType}</p>
                <p><strong>Date:</strong> ${new Date(hearing.nextHearingDate).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span class="status ${hearing.status.toLowerCase()}">${hearing.status}</span></p>
            </div>
            <div class="hearing-actions">
                <button onclick="updateHearing('${hearing._id}')">Update Date</button>
                <button onclick="viewCaseDetails('${hearing._id}')">View Case</button>
            </div>
        </div>
    `).join('');
} 