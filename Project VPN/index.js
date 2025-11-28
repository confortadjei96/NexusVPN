document.addEventListener('DOMContentLoaded', ()=>{
	// Set year in footer
	const yearEl = document.getElementById('year');
	if(yearEl) yearEl.textContent = new Date().getFullYear();

	// Smooth scroll for nav links
	document.querySelectorAll('a[href^="#"]').forEach(a=>{
		a.addEventListener('click', (e)=>{
			const href = a.getAttribute('href');
			if(href && href.startsWith('#')){
				const target = document.querySelector(href);
				if(target){
					e.preventDefault();
					target.scrollIntoView({behavior:'smooth',block:'start'});
				}
			}
		});
	});

	// Inline toast message (replaces alert)
	const toastEl = document.getElementById('toast');
	const showMessage = (msg, timeout=3000)=>{
		if(!toastEl) { window.alert(msg); return; }
		toastEl.textContent = msg;
		toastEl.classList.add('show');
		clearTimeout(toastEl._hideTimer);
		toastEl._hideTimer = setTimeout(()=>{
			toastEl.classList.remove('show');
		}, timeout);
	};

	const byId = (id)=>document.getElementById(id);
	['btn-free','btn-premium','get-free-card','get-premium-card','download-windows','download-mac'].forEach(id=>{
		const el = byId(id);
		if(!el) return;
		el.addEventListener('click', (e)=>{
			e.preventDefault();
			switch(id){
				case 'btn-free':
				case 'get-free-card':
					showMessage('Thanks — starting Free signup flow (placeholder).');
					break;
				case 'btn-premium':
				case 'get-premium-card':
					openPremiumModal();
					break;
				case 'download-windows':
					showMessage('Preparing Windows download... (placeholder).');
					break;
				case 'download-mac':
					showMessage('Preparing macOS download... (placeholder).');
					break;
			}
		});
	});

	// Mobile nav toggle with slide-in animation and backdrop
	const navToggle = byId('nav-toggle');
	const primaryNav = document.getElementById('primary-nav');
	const navBackdrop = document.getElementById('nav-backdrop');
	function openNav(){
		if(!primaryNav || !navToggle) return;
		primaryNav.classList.add('open');
		navToggle.setAttribute('aria-expanded','true');
		if(navBackdrop){ navBackdrop.classList.add('show'); navBackdrop.hidden = false; }
		// move focus to first link
		const firstLink = primaryNav.querySelector('a');
		if(firstLink) firstLink.focus();
	}
	function closeNav(){
		if(!primaryNav || !navToggle) return;
		primaryNav.classList.remove('open');
		navToggle.setAttribute('aria-expanded','false');
		if(navBackdrop){ navBackdrop.classList.remove('show'); navBackdrop.hidden = true; }
		navToggle.focus();
	}
	if(navToggle && primaryNav){
		navToggle.addEventListener('click', ()=>{
			const expanded = navToggle.getAttribute('aria-expanded') === 'true';
			if(expanded) closeNav(); else openNav();
		});
	}
	// Close when clicking backdrop
	if(navBackdrop){
		navBackdrop.addEventListener('click', (e)=>{ closeNav(); });
		// also close when elements with data-close attribute clicked (we added to backdrop markup)
		navBackdrop.querySelectorAll('[data-close]');
	}
	// Close nav on Escape key
	document.addEventListener('keydown', (e)=>{
		if(e.key === 'Escape'){
			// close both nav and modal if open
			if(primaryNav && primaryNav.classList.contains('open')){ closeNav(); }
			const pm = document.getElementById('premium-modal');
			if(pm && !pm.hidden){ pm.querySelector('[data-close]')?.click(); }
		}
	});

	// Premium modal handling (client-side mock purchase)
	const premiumModal = document.getElementById('premium-modal');
	const premiumForm = document.getElementById('premium-form');
	const premiumResult = document.getElementById('premium-result');
	const closeButtons = premiumModal ? premiumModal.querySelectorAll('[data-close]') : [];

	function openPremiumModal(){
		if(!premiumModal) { showMessage('Premium flow not available.'); return; }
		premiumModal.hidden = false;
		// focus the first input
		const first = premiumModal.querySelector('input,select,button');
		if(first) first.focus();
	}

	function closePremiumModal(){
		if(!premiumModal) return;
		premiumModal.hidden = true;
		premiumResult.hidden = true;
		premiumResult.textContent = '';
	}

	closeButtons.forEach(cb=>cb.addEventListener('click', closePremiumModal));
	if(premiumModal){
		premiumModal.addEventListener('click', (e)=>{
			if(e.target === premiumModal.querySelector('.modal-overlay')) closePremiumModal();
		});
	}

	if(premiumForm){
		// Basic Luhn algorithm for card number validation
		function luhnCheck(num){
			const digits = num.replace(/\D/g, '');
			let sum = 0;
			let alt = false;
			for(let i = digits.length - 1; i >= 0; i--){
				let n = parseInt(digits.charAt(i), 10);
				if(alt){
					n *= 2;
					if(n > 9) n -= 9;
				}
				sum += n;
				alt = !alt;
			}
			return digits.length > 0 && (sum % 10) === 0;
		}

		function validateCardFields(fd){
			const name = fd.get('card_name') || '';
			const number = (fd.get('card_number') || '').toString().replace(/\s+/g,'');
			const expiry = fd.get('card_expiry') || '';
			const cvc = (fd.get('card_cvc') || '').toString();

			if(!name.trim()) return 'Cardholder name is required.';
			if(!/^[0-9]{12,19}$/.test(number) || !luhnCheck(number)) return 'Enter a valid card number.';
			if(!/^\d{2}\/\d{2}$/.test(expiry)) return 'Expiry must be in MM/YY format.';
			const [mm, yy] = expiry.split('/').map(s=>parseInt(s,10));
			if(mm < 1 || mm > 12) return 'Expiry month is invalid.';
			if(!/^[0-9]{3,4}$/.test(cvc)) return 'CVC must be 3 or 4 digits.';
			return null;
		}

		premiumForm.addEventListener('submit', async (e)=>{
			e.preventDefault();
			const formData = new FormData(premiumForm);
			const email = formData.get('email');
			const plan = formData.get('plan');

			premiumResult.hidden = false;
			premiumResult.textContent = 'Validating card details...';

			const validationError = validateCardFields(formData);
			if(validationError){
				premiumResult.textContent = validationError;
				showMessage('Please fix card details.');
				return;
			}

			premiumResult.textContent = 'Processing payment...';

			try{
				// Call mock backend purchase endpoint (do NOT send raw card data to mock server)
				const purchaseResp = await fetch('http://localhost:3000/api/purchase', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email, plan })
				});
				if(!purchaseResp.ok) throw new Error('Purchase failed');
				const purchaseJson = await purchaseResp.json();
				const purchaseId = purchaseJson.purchaseId;

				premiumResult.textContent = 'Purchase completed. Provisioning your account...';

				// Call provisioning endpoint
				const provResp = await fetch('http://localhost:3000/api/provision', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ purchaseId })
				});
				if(!provResp.ok) throw new Error('Provisioning failed');
				const provJson = await provResp.json();
				const downloadUrl = provJson.downloadUrl;

				// Show success and download link
				premiumResult.innerHTML = `Provisioned — <a href="http://localhost:3000${downloadUrl}" target="_blank" rel="noopener">Download config</a>`;
				showMessage('Upgrade complete — config ready to download.');
				// Close modal after short delay
				setTimeout(()=>{
					closePremiumModal();
				}, 1400);
			}catch(err){
				console.error(err);
				premiumResult.textContent = 'An error occurred during purchase/provisioning. Check the server and try again.';
				showMessage('Upgrade failed — see console for details.');
			}
		});
	}
});
