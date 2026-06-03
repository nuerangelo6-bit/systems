import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MdGavel, MdSecurity, MdSpeed, MdPeople, MdKeyboardArrowDown, MdEmail, MdLock, MdPerson, MdSchool, MdVisibility, MdVisibilityOff } from 'react-icons/md'

export default function Landing() {
  const navigate = useNavigate()
  const [showRegister, setShowRegister] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    student_id: '',
    password: '',
    confirm_password: ''
  })
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [resendDisabled, setResendDisabled] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showLoginHint, setShowLoginHint] = useState(false)
  const isSubmittingRef = useRef(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  const handleSendOTP = async () => {
    setError('')
    setResendDisabled(true)

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })

      const data = await response.json()

      if (data.success) {
        setOtpSent(true)
        setTimeout(() => setResendDisabled(false), 10000)
      } else {
        setError(data.message || 'Failed to send OTP')
        setResendDisabled(false)
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.')
      setResendDisabled(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (isSubmitting || isSubmittingRef.current) {
      console.log('Already submitting, ignoring duplicate click')
      return
    }

    if (!otpSent) {
      setError('Please send OTP first')
      return
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match')
      return
    }

    isSubmittingRef.current = true
    setIsSubmitting(true)
    console.log('Form submission started, isSubmitting set to true')

    try {
      console.log('Starting OTP verification...')
      const verifyResponse = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp })
      })

      const verifyData = await verifyResponse.json()
      console.log('OTP verification response:', verifyData)

      if (!verifyData.success) {
        setError(verifyData.message || 'Invalid OTP')
        setIsSubmitting(false)
        isSubmittingRef.current = false
        return
      }

      console.log('Starting registration...')
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          full_name: formData.full_name,
          email: formData.email,
          student_id: formData.student_id,
          password: formData.password
        })
      })

      const registerData = await registerResponse.json()
      console.log('Registration response:', registerData)

      if (registerData.success) {
        setIsSubmitting(false)
        isSubmittingRef.current = false
        console.log('Registration successful, showing success message...')
        setSuccessMessage('Registration successful! Redirecting to landing page...')
        // Reset form after successful registration
        setFormData({
          username: '',
          full_name: '',
          email: '',
          student_id: '',
          password: '',
          confirm_password: ''
        })
        setOtp('')
        setOtpSent(false)
        setError('')

        // Show success message for 5 seconds then redirect
        setTimeout(() => {
          setShowRegister(false)
          setSuccessMessage('')
          setShowLoginHint(true)
          // Hide login hint after 5 seconds
          setTimeout(() => {
            setShowLoginHint(false)
          }, 5000)
        }, 5000)
      } else {
        setError(registerData.message || 'Registration failed')
        setIsSubmitting(false)
        isSubmittingRef.current = false
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Failed to register. Please try again.')
      setIsSubmitting(false)
      isSubmittingRef.current = false
    }
  }

  const handleOTPVerify = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const verifyResponse = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp })
      })

      const verifyData = await verifyResponse.json()

      if (!verifyData.success) {
        setError(verifyData.message || 'Invalid OTP')
        return
      }

      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          full_name: formData.full_name,
          email: formData.email,
          student_id: formData.student_id,
          password: formData.password
        })
      })

      const registerData = await registerResponse.json()

      if (registerData.success) {
        navigate('/login')
      } else {
        setError(registerData.message || 'Registration failed')
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.')
    }
  }

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginForm.username, password: loginForm.password })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('gms_user', JSON.stringify(data.data))
        localStorage.setItem('gms_token', data.data.token)
        window.location.href = data.data.role === 'student' ? '/student' : '/'
      } else {
        setError(data.message || 'Invalid credentials')
      }
    } catch (err) {
      setError('Failed to login. Please try again.')
    }
  }

  if (showLogin) {
    return (
      <div className="landing-page">
        <div className="landing-form-container">
          <div className="landing-card">
            <div className="landing-header">
              <MdLock size={48} color="var(--accent)" />
              <h1>Login</h1>
              <p>Sign in to your account</p>
            </div>
            <form onSubmit={handleLogin} className="landing-form">
              {error && <div className="error-message">{error}</div>}
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <div style={{position: 'relative'}}>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    required
                    style={{paddingRight: '40px'}}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: '0'
                    }}
                  >
                    {showLoginPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-block">
                Login
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => setShowLogin(false)}
              >
                Back to Landing
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (showRegister) {
    return (
      <div className="landing-page">
        <div className="landing-form-container">
          <div className="landing-card">
            <div className="landing-header">
              <MdPerson size={48} color="var(--accent)" />
              <h1>Create Your Account</h1>
              <p>Register with your institutional email</p>
            </div>
            <form onSubmit={handleRegisterSubmit} className="landing-form">
              {successMessage && <div className="success-message" style={{backgroundColor: '#4CAF50', color: 'white', padding: '10px', borderRadius: '5px', marginBottom: '10px'}}>{successMessage}</div>}
              {error && <div className="error-message">{error}</div>}
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <div style={{display: 'flex', gap: '10px'}}>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="your@email.com"
                    required
                    style={{flex: 1}}
                  />
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="btn btn-primary"
                    disabled={otpSent}
                  >
                    {otpSent ? 'Sent' : 'Send OTP'}
                  </button>
                </div>
              </div>
              {otpSent && (
                <div className="form-group">
                  <label>Enter OTP Code</label>
                  <input
                    type="text"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="btn btn-ghost"
                    style={{marginTop: '10px', fontSize: '0.9rem'}}
                    disabled={resendDisabled}
                  >
                    {resendDisabled ? 'Sent' : 'Resend OTP'}
                  </button>
                </div>
              )}
              <div className="form-group">
                <label>Student ID</label>
                <input
                  type="text"
                  value={formData.student_id}
                  onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <div style={{position: 'relative'}}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    style={{paddingRight: '40px'}}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: '0'
                    }}
                  >
                    {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <div style={{position: 'relative'}}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                    required
                    style={{paddingRight: '40px'}}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: '0'
                    }}
                  >
                    {showConfirmPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => setShowRegister(false)}
              >
                Back to Landing
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="landing-page">
      <div className="landing-triangles">
        <div className="triangle-1"></div>
        <div className="triangle-2"></div>
        <div className="triangle-3"></div>
        <div className="triangle-4"></div>
        <div className="triangle-5"></div>
        <div className="triangle-6"></div>
        <div className="triangle-7"></div>
        <div className="triangle-8"></div>
      </div>
      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <img src="/image/addsu_logo.jpg" alt="ADDSU Logo" style={{width: 40, height: 40, objectFit: 'contain'}} />
          <span>ADDSU GMS</span>
        </div>
        <div className="landing-nav-links">
          <button onClick={() => scrollToSection('about')} className="btn btn-ghost">About</button>
          <button onClick={() => scrollToSection('features')} className="btn btn-ghost">Features</button>
          <div style={{position: 'relative', display: 'inline-block'}}>
            <button onClick={() => setShowLogin(true)} className="btn btn-primary" id="login-button">Log in</button>
            {showLoginHint && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '10px',
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '5px',
                fontSize: '14px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                zIndex: 1000,
                animation: 'fadeIn 0.3s ease-in'
              }}>
                Click here to log in! ↑
              </div>
            )}
          </div>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1>Agusan del Sur State University</h1>
          <h2>Grievance Management System</h2>
          <p>A secure and efficient platform for students to file, track, and resolve grievances within the institution.</p>
          <div className="landing-hero-actions">
            <button onClick={() => setShowRegister(true)} className="btn btn-primary btn-lg">
              Create Your Account
            </button>
            <button onClick={() => setShowLogin(true)} className="btn btn-ghost btn-lg">
              Login
            </button>
          </div>
          <button onClick={() => scrollToSection('about')} className="landing-scroll">
            <MdKeyboardArrowDown size={32} />
          </button>
        </div>
      </section>

      <section id="about" className="landing-section">
        <div className="landing-container">
          <h2>What is this system about?</h2>
          <p className="landing-section-desc">
            The Grievance Management System (GMS) is a digital platform designed to streamline the process of filing, tracking, and resolving grievances within Agusan del Sur State University. It provides students with a secure and confidential way to report issues, while ensuring transparency and accountability throughout the resolution process.
          </p>
          <div className="landing-grid">
            <div className="landing-card-feature">
              <MdSecurity size={40} color="var(--accent)" />
              <h3>Secure & Confidential</h3>
              <p>Your grievances are handled with complete confidentiality and security.</p>
            </div>
            <div className="landing-card-feature">
              <MdSpeed size={40} color="var(--accent)" />
              <h3>Fast Resolution</h3>
              <p>Track your grievances in real-time and get timely updates on your case.</p>
            </div>
            <div className="landing-card-feature">
              <MdPeople size={40} color="var(--accent)" />
              <h3>Fair Process</h3>
              <p>Ensure fair and impartial handling of all grievances through proper channels.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="landing-section landing-section-alt">
        <div className="landing-container">
          <h2>Key Features</h2>
          <div className="landing-grid">
            <div className="landing-card-feature">
              <MdGavel size={40} color="var(--accent)" />
              <h3>Easy Filing</h3>
              <p>Submit grievances online with attachments and detailed descriptions.</p>
            </div>
            <div className="landing-card-feature">
              <MdLock size={40} color="var(--accent)" />
              <h3>Real-time Tracking</h3>
              <p>Monitor the status of your grievance from submission to resolution.</p>
            </div>
            <div className="landing-card-feature">
              <MdEmail size={40} color="var(--accent)" />
              <h3>Notifications</h3>
              <p>Receive email notifications for updates on your case.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-container">
          <h2>Ready to get started?</h2>
          <p>Create your account with your institutional email to begin filing grievances.</p>
          <button onClick={() => setShowRegister(true)} className="btn btn-primary btn-lg">
            Create Your Account
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© 2026 Agusan del Sur State University · Grievance Management System</p>
      </footer>
    </div>
  )
}
