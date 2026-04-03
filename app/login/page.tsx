'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast'
import Logo from '@/components/Logo'
import Link from 'next/link'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'

export default function LoginPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Success — send existing users directly to the start/home screen
      showToast({
        type: 'success',
        title: 'Signed in',
        message: 'Welcome back!',
      })

      router.push('/start')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first')
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      showToast({
        type: 'success',
        title: 'Reset Email Sent',
        message: 'Password reset email sent! Please check your inbox.',
      })
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    }
  }

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
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '2rem',
              fontWeight: 600,
              color: 'var(--cream)',
              marginBottom: 8
            }}
          >
            Welcome Back
          </h1>
          <p 
            style={{
              fontFamily: 'Lato, sans-serif',
              fontSize: '0.875rem',
              color: 'var(--muted)'
            }}
          >
            Sign in to your account
          </p>
        </div>

        {error && (
          <div 
            style={{
              marginBottom: 16,
              padding: 12,
              background: 'rgba(232, 96, 96, 0.1)',
              border: '1px solid rgba(232, 96, 96, 0.2)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--danger)',
              fontSize: '0.875rem',
              fontFamily: 'Lato, sans-serif'
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label 
              style={{
                display: 'block',
                fontFamily: 'Lato, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--cream)',
                marginBottom: 8,
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
            >
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail 
                size={20} 
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)'
                }} 
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: 44,
                  paddingRight: 16,
                  paddingTop: 12,
                  paddingBottom: 12,
                  background: 'var(--ink)',
                  border: '1px solid var(--amber-border)',
                  borderRadius: 8,
                  color: 'var(--cream)',
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.15s'
                }}
                placeholder="your@email.com"
                required
                autoComplete="email"
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--amber)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--amber-border)'}
              />
            </div>
          </div>

          <div>
            <label 
              style={{
                display: 'block',
                fontFamily: 'Lato, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--cream)',
                marginBottom: 8,
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock 
                size={20} 
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)'
                }} 
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: 44,
                  paddingRight: 48,
                  paddingTop: 12,
                  paddingBottom: 12,
                  background: 'var(--ink)',
                  border: '1px solid var(--amber-border)',
                  borderRadius: 8,
                  color: 'var(--cream)',
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.15s'
                }}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--amber)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--amber-border)'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--muted)', fontFamily: 'Lato, sans-serif' }}>
              <input
                type="checkbox"
                style={{
                  width: 16,
                  height: 16,
                  accentColor: 'var(--amber)',
                  border: '1px solid var(--amber-border)',
                  borderRadius: 4
                }}
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--amber)',
                fontFamily: 'Lato, sans-serif',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: 'var(--amber)',
              color: 'var(--ink)',
              padding: '12px 24px',
              borderRadius: 8,
              fontFamily: 'Lato, sans-serif',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'all 0.15s',
              border: 'none'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.875rem', color: 'var(--muted)', fontFamily: 'Lato, sans-serif' }}>
          Don't have an account?{' '}
          <Link 
            href="/signup" 
            style={{
              color: 'var(--amber)',
              fontFamily: 'Lato, sans-serif',
              fontWeight: 600,
              textDecoration: 'underline'
            }}
          >
            Sign Up
          </Link>
        </div>

        <div style={{ marginTop: 32 }}>
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%', borderTop: '1px solid var(--border)' }}></div>
            </div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', fontSize: '0.875rem' }}>
              <span style={{ padding: '0 8px', background: 'var(--ink2)', color: 'var(--muted)' }}>Or continue with</span>
            </div>
          </div>
          <div>
            <GoogleSignInButton />
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', marginTop: 24, fontFamily: 'Lato, sans-serif' }}>
          By signing in, you agree to our{' '}
          <a href="/terms" style={{ color: 'var(--amber)', textDecoration: 'underline' }}>Terms</a> and{' '}
          <a href="/privacy" style={{ color: 'var(--amber)', textDecoration: 'underline' }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}
