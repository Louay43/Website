
document.getElementById('contactForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const name = this.name.value.trim();
  const email = this.email.value.trim();
  const subject = this.subject.value.trim();
  const message = this.message.value.trim();
  const status = document.getElementById('formStatus');
  const button = document.getElementById('submitBtn');

  // Basic validation
  if (!name || !email || !subject || !message) {
    status.textContent = 'Please fill in all fields.';
    status.style.color = 'orange';
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    status.textContent = 'Please enter a valid email.';
    status.style.color = 'orange';
    return;
  }

  // Disable button while sending
  button.disabled = true;
  button.textContent = 'Sending...';

  try {
    const res = await fetch('http://localhost:3000/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message })
    });

    if (res.ok) {
      button.textContent = 'Sent ✅';
      status.textContent = '';
    } else {
      button.textContent = 'Send';
      status.textContent = 'Failed to send. Try again later.';
      status.style.color = 'red';
    }
  } catch (err) {
    console.log(err);
    button.textContent = 'Send';
    status.textContent = 'Error sending. Check your connection.';
    status.style.color = 'red';
  }

  // Re-enable after 5 seconds
  setTimeout(() => {
    button.disabled = false;
    button.textContent = 'Send';
    status.textContent = '';
  }, 5000);
});

