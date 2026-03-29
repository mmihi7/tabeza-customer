'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// Imports retained for use in StepAccount (task 3.2) and other steps
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'
import Logo from '@/components/Logo'
import Link from 'next/link'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { getConsentRecord } from '@/lib/consent-records'
import StepDots from '@/components/onboarding/StepDots'
import StepAccount from './StepAccount'
import StepProfile from './StepProfile'
import StepVerify from './StepVerify'
import StepConsent from './StepConsent'
import StepConnect from './StepConnect'

// ─── Types ────────────────────────────────────────────────────────────────────

type WizardStep = 0 | 1 | 2 | 3 | 4
type ConsentDecision = 'agreed' | 'skipped' | null

// ─── SignupWizard ─────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter()
  const { showToast } = useToast()

  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<WizardStep>(0)

  // ── Account step state ──────────────────────────────────────────────────────
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // ── Profile step state ──────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [mobile, setMobile] = useState('')

  // ── Consent step state ──────────────────────────────────────────────────────
  const [consentDecision, setConsentDecision] = useState<ConsentDecision>(null)

  // ── Current user ID — populated from Supabase session ───────────────────────
  const [userId, setUserId] = useState<string>('')

  // ── On mount: check for existing consent record ─────────────────────────────
  // Requirements: 5.1, 12.5 — skip Consent step if a record already exists
  useEffect(() => {
    async function checkConsentRecord() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          // No authenticated user — stay on step 0 (Account)
          return
        }
        // Populate userId for use in StepConsent
        setUserId(user.id)
        const record = await getConsentRecord(user.id)
        if (record && (record.decision === 'agreed' || record.decision === 'skipped')) {
          // Consent already given — skip to Connect step
          setStep(4)
        }
      } catch (err) {
        // Gracefully ignore errors on mount; user stays on step 0
        console.error('Error checking consent record on mount:', err)
      }
    }

    checkConsentRecord()
  }, [])

  // ── Step renderer ────────────────────────────────────────────────────────────
  function renderStep() {
    switch (step) {
      case 0:
        return (
          <StepAccount
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onNext={() => setStep(1)}
          />
        )
      case 1:
        return (
          <StepProfile
            firstName={firstName}
            lastName={lastName}
            mobile={mobile}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            onMobileChange={setMobile}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )
      case 2:
        return (
          <StepVerify email={email} onVerified={() => setStep(3)} />
        )
      case 3:
        return (
          <StepConsent
            userId={userId}
            onDecision={(decision) => {
              setConsentDecision(decision)
              setStep(4)
            }}
          />
        )
      case 4:
        return (
          <StepConnect
            onVenueConnected={(slug) => router.push(`/start?bar=${slug}`)}
          />
        )
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: 'var(--ink)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 24 }}>
        <Logo size="lg" />
      </div>

      {/* Step dots — Requirements: 11.1 */}
      <div style={{ marginBottom: 32 }}>
        <StepDots total={5} current={step} />
      </div>

      {/* Step content */}
      <div style={{ width: '100%', maxWidth: 400 }}>
        {renderStep()}
      </div>
    </div>
  )
}

// ─── Original handleSubmit — will be integrated into StepAccount in task 3.2 ──
/*
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')

  if (password !== confirmPassword) {
    setError('Passwords do not match')
    return
  }
  if (password.length < 6) {
    setError('Password must be at least 6 characters')
    return
  }

  setLoading(true)

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    // Success
    showToast({
      type: 'success',
      title: 'Account created',
      message: 'Please check your email to confirm your account.',
    })

    // Redirect to home or login page
    router.push('/')
  } catch (err: any) {
    console.error('Signup error:', err)
    // If user already registered, attempt to sign in with provided credentials
    if (err.message?.toLowerCase().includes('already registered') || err.message?.toLowerCase().includes('user already exists')) {
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        // Sign in succeeded
        showToast({
          type: 'success',
          title: 'Welcome back!',
          message: 'You have been signed in.',
        })
        router.push('/')
        return
      } catch (signInErr: any) {
        // If sign in fails, fall through to original error
        console.error('Sign-in error:', signInErr)
        // Update error to reflect sign-in failure
        setError(signInErr.message || 'Invalid email or password')
      }
    } else {
      setError(err.message || 'Failed to create account')
    }
  } finally {
    setLoading(false)
  }
}
*/
