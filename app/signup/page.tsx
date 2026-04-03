'use client';

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, QrCode, ChevronRight, Phone, Apple, User, Shield, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'
import Logo from '@/components/Logo'
import Link from 'next/link'
import { persistConsentRecord, APP_VERSION } from '@/lib/consent-records'

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--ink)' }}>
        <div style={{ width: 40, height: 40, borderTop: '3px solid var(--amber)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()

  // If redirected from email confirmation, jump straight to consent
  const initialStep = searchParams.get('step') === 'consent' ? 'consent' : 'account'
  const [step, setStep] = useState<'account' | 'name' | 'verify' | 'consent' | 'success'>(initialStep as any)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastSignupAttempt, setLastSignupAttempt] = useState<number>(0)

  // Poll for email confirmation when on verify step
  useEffect(() => {
    if (step !== 'verify') return
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email_confirmed_at) {
        clearInterval(interval)
        setStep('consent')
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [step])

  useEffect(() => {
    // If we're on the consent step (redirected from email confirmation),
    // don't redirect away — the user needs to complete consent first.
    if (initialStep === 'consent') return

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) router.push('/start')
    }
    checkAuth()
  }, [router])

  const handleSignup = async () => {
    if (!email || !password) return
    
    // Rate limiting: prevent multiple signup attempts within 30 seconds
    const now = Date.now()
    if (lastSignupAttempt && (now - lastSignupAttempt) < 30000) {
      showToast({
        type: 'warning',
        title: 'Please Wait',
        message: 'Please wait 30 seconds before trying again'
      })
      return
    }

    setLoading(true)
    setLastSignupAttempt(now)
    
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { 
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
          data: {
            first_name: firstName,
            last_name: lastName,
            mobile_number: mobileNumber
          }
        }
      })
      if (error) {
        if (error.status === 429) {
          showToast({
            type: 'error',
            title: 'Rate Limit Exceeded',
            message: 'Too many signup attempts. Please wait a few minutes and try again.'
          })
        } else {
          showToast({ type: 'error', title: 'Signup Failed', message: error.message })
        }
      } else {
        showToast({ type: 'success', title: 'Account Created', message: 'Please check your email' })
        setStep('verify')
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Signup Failed', message: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const handleNameSubmit = () => {
    if (!firstName) {
      showToast({ type: 'warning', title: 'Missing Information', message: 'Please enter your first name' })
      return
    }
    setStep('verify')
  }

  const handleConsent = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      try {
        await persistConsentRecord({ userId: session.user.id, decision: 'agreed', appVersion: APP_VERSION })
      } catch (err) {
        console.warn('Could not persist consent record:', err)
      }
    }
    setStep('success')
  }

  const handleConnect = () => router.push('/start')

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        backgroundColor: 'var(--ink)',
        position: 'relative'
      }}
    >
      <div style={{ position: 'absolute', top: 32, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Logo size="lg" />
      </div>

      <div 
        style={{
          background: 'var(--ink2)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 32,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          maxWidth: 400,
          width: '100%'
        }}
      >
        {/* Step 1: Create your account */}
        {step === 'account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: 600, 
                color: 'var(--cream)', 
                marginBottom: 8
              }}>
                Create your account
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
                Sign up with your email to get started.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: 'var(--cream)', 
                  marginBottom: 8 
                }}>
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      backgroundColor: 'var(--ink3)',
                      color: 'var(--cream)',
                      fontSize: '14px'
                    }}
                    placeholder="amara@example.com" 
                  />
                </div>
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: 'var(--cream)', 
                  marginBottom: 8 
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      backgroundColor: 'var(--ink3)',
                      color: 'var(--cream)',
                      fontSize: '14px'
                    }}
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 12,
                      color: 'var(--muted)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 4 }}>At least 8 characters.</p>
              </div>

              <div style={{ position: 'relative', margin: '16px 0' }}>
                <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  display: 'flex', 
                  alignItems: 'center'
                }}>
                  <div style={{ 
                    width: '100%', 
                    borderTop: '1px solid var(--border)' 
                  }}></div>
                </div>
                <div style={{ 
                  position: 'relative', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  fontSize: '14px'
                }}>
                  <span style={{ 
                    padding: '0 8px', 
                    backgroundColor: 'var(--ink2)', 
                    color: 'var(--muted)' 
                  }}>
                    or sign up with
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <button 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    backgroundColor: 'transparent',
                    color: 'var(--muted)',
                    cursor: 'not-allowed'
                  }}
                  disabled
                >
                  <Phone style={{ width: 16, height: 16 }} />
                </button>
                {/* Google sign-in placeholder — not yet implemented */}
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    backgroundColor: 'transparent',
                    color: 'var(--muted)',
                    cursor: 'not-allowed'
                  }}
                  disabled
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                </button>
                <button 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    backgroundColor: 'transparent',
                    color: 'var(--muted)',
                    cursor: 'not-allowed'
                  }}
                  disabled
                >
                  <Apple style={{ width: 16, height: 16 }} />
                </button>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}>
                Phone · Google · Apple coming soon
              </p>
            </div>

            <button 
              onClick={handleSignup} 
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: 'var(--amber)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: 8,
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Creating account...' : 'Create account →'}
            </button>

            <p style={{ fontSize: '14px', textAlign: 'center', color: 'var(--muted)' }}>
              Already have an account? 
              <Link href="/login" style={{ color: 'var(--amber)', textDecoration: 'none', fontWeight: 500 }}>
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* Step 2: Your name */}
        {step === 'name' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: 600, 
                color: 'var(--cream)', 
                marginBottom: 8
              }}>
                Your name
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
                This is how venues will know you.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: 'var(--cream)', 
                  marginBottom: 8 
                }}>
                  First name
                </label>
                <input 
                  type="text" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    backgroundColor: 'var(--ink3)',
                    color: 'var(--cream)',
                    fontSize: '14px'
                  }}
                  placeholder="Amara" 
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: 'var(--cream)', 
                  marginBottom: 8 
                }}>
                  Last name (optional)
                </label>
                <input 
                  type="text" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    backgroundColor: 'var(--ink3)',
                    color: 'var(--cream)',
                    fontSize: '14px'
                  }}
                  placeholder="e.g. Wanjiku" 
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: 'var(--cream)', 
                  marginBottom: 8 
                }}>
                  Mobile number (optional — for M-Pesa)
                </label>
                <input 
                  type="tel" 
                  value={mobileNumber} 
                  onChange={(e) => setMobileNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    backgroundColor: 'var(--ink3)',
                    color: 'var(--cream)',
                    fontSize: '14px'
                  }}
                  placeholder="+254 7XX XXX XXX" 
                />
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 4 }}>
                  You can add your number later. Used only for M-Pesa payment prompts.
                </p>
              </div>
            </div>

            <button 
              onClick={handleNameSubmit}
              style={{
                width: '100%',
                backgroundColor: 'var(--amber)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: 8,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 3: Check your inbox */}
        {step === 'verify' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center' }}>
            <div style={{ 
              width: 64, 
              height: 64, 
              backgroundColor: '#10b98120', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 16px' 
            }}>
              <Mail style={{ width: 32, height: 32, color: '#10b981' }} />
            </div>
            
            <div>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: 600, 
                color: 'var(--cream)', 
                marginBottom: 8
              }}>
                Check your inbox
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: 16 }}>
                We sent a link to<br />
                <strong style={{ color: 'var(--cream)' }}>{email}</strong>
              </p>
              <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: 24 }}>
                ✉<br />
                Click the link in your email to verify your address. Link expires in 24 hours.
              </p>
              <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: 24 }}>
                Nothing arrived? Check spam or resend the email.
              </p>
            </div>

            {/* Waiting indicator — page auto-advances once email is confirmed */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--muted)', fontSize: '14px' }}>
              <div style={{ width: 16, height: 16, borderTop: '2px solid var(--amber)', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              Waiting for confirmation…
            </div>
          </div>
        )}

        {/* Step 4: Quick & honest */}
        {step === 'consent' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: 600, 
                color: 'var(--cream)', 
                marginBottom: 8
              }}>
                Quick & honest
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
                Here's what Tabeza uses to make your experience better.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <CheckCircle style={{ width: 20, height: 20, color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: '14px', color: 'var(--cream)', fontWeight: 500, marginBottom: 4 }}>
                    How often you visit a venue — shown as visit icons on your profile
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <CheckCircle style={{ width: 20, height: 20, color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: '14px', color: 'var(--cream)', fontWeight: 500, marginBottom: 4 }}>
                    What you spend per visit — used to determine your tier at each venue
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <CheckCircle style={{ width: 20, height: 20, color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: '14px', color: 'var(--cream)', fontWeight: 500, marginBottom: 4 }}>
                    Orders & payments — to run your tab and close it securely
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 8 }}>
                Your data is never sold. Full Terms & Privacy Policy at tabeza.co.ke/legal
              </p>
            </div>

            <button 
              onClick={handleConsent}
              style={{
                width: '100%',
                backgroundColor: 'var(--amber)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: 8,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              I agree — let's go →
            </button>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center' }}>
            <div style={{ 
              width: 64, 
              height: 64, 
              backgroundColor: '#10b98120', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 16px' 
            }}>
              <ChevronRight style={{ width: 32, height: 32, color: '#10b981' }} />
            </div>
            
            <div>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: 600, 
                color: 'var(--cream)', 
                marginBottom: 8
              }}>
                You're all set{firstName ? `, ${firstName}` : ''}!
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
                Open your first tab at any Tabeza venue.
              </p>
            </div>

            <button 
              onClick={handleConnect}
              style={{
                width: '100%',
                backgroundColor: 'var(--amber)',
                color: 'var(--ink)',
                padding: '14px 16px',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '15px',
                border: 'none',
              }}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
