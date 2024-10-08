// app/static/script.js

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const progress = document.getElementById('progress');
    const progressBar = document.getElementById('progress-bar');
    const markdownPreview = document.getElementById('markdown-preview');
    const imagesDiv = document.getElementById('images');
    const fileCount = document.getElementById('file-count');
    const copyButton = document.getElementById('copy-button');
    const themeToggle = document.getElementById('theme-toggle');
    const themeLabel = document.getElementById('theme-label');

    let currentMarkdown = ''; // Store the latest Markdown content

    // Initialize theme based on user preference or default to light
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
    }

    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    function handleFiles(files) {
        if (files.length === 0) return;
        const file = files[0];
        if (file.type !== "application/pdf") {
            alert("Please upload a PDF file.");
            return;
        }
        uploadFile(file);
    }

    function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        progress.hidden = false;
        progressBar.style.width = '0%';
        markdownPreview.innerHTML = '';
        imagesDiv.innerHTML = '';
        currentMarkdown = '';

        fetch('/convert', {
            method: 'POST',
            body: formData
        }).then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw err; });
            }
            return response.json();
        }).then(data => {
            currentMarkdown = data.markdown; // Store the Markdown content

            // Render Markdown using Marked.js
            const renderer = new marked.Renderer();
            marked.setOptions({
                renderer: renderer,
                highlight: function(code, lang) {
                    if (hljs.getLanguage(lang)) {
                        return hljs.highlight(code, { language: lang }).value;
                    } else {
                        return hljs.highlightAuto(code).value;
                    }
                },
                langPrefix: 'hljs language-', // Highlight.js css expects a top-level 'hljs' class.
                breaks: true,
                gfm: true
            });
            const htmlContent = marked.parse(data.markdown);
            markdownPreview.innerHTML = htmlContent;
            // Re-highlight any new code blocks
            document.querySelectorAll('#markdown-preview pre code').forEach((block) => {
                hljs.highlightElement(block);
            });

            // Add images
            data.images.forEach(img => {
                const imgElement = document.createElement('img');
                imgElement.src = `/static/uploads/${img}`;
                imagesDiv.appendChild(imgElement);
            });

            // Update the file count
            fileCount.textContent = data.total;
        }).catch(error => {
            alert(error.error || "An error occurred during conversion.");
        }).finally(() => {
            progress.hidden = true;
        });

        // Simulate progress (optional)
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 90) {
                clearInterval(interval);
            } else {
                width += 10;
                progressBar.style.width = width + '%';
            }
        }, 200);
    }

    // Copy Markdown to Clipboard
    copyButton.addEventListener('click', () => {
        if (currentMarkdown.trim() === '') {
            alert('No Markdown content to copy.');
            return;
        }
        navigator.clipboard.writeText(currentMarkdown).then(() => {
            alert('Markdown copied to clipboard!');
        }).catch(err => {
            alert('Failed to copy Markdown.');
        });
    });
});
