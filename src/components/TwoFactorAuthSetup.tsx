'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Button from './Button';

interface TwoFactorAuthSetupProps {
  onComplete: (secret: string, backupCodes: string[]) => Promise<void>;
  onCancel: () => void;
}

export default function TwoFactorAuthSetup({ onComplete, onCancel }: TwoFactorAuthSetupProps) {
  const [step, setStep] = useState<'generate' | 'verify' | 'backup'>('generate');
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate a new 2FA secret
  const generateSecret = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // In a real app, this would be an API call to generate a secret
      // For demo purposes, we'll simulate it
      const mockSecret = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      const mockQrCodeUrl = `otpauth://totp/AFP_PMS:${encodeURIComponent('user@example.com')}?secret=${mockSecret}&issuer=AFP_PMS`;
      
      setSecret(mockSecret);
      setQrCodeUrl(mockQrCodeUrl);
      setStep('verify');
    } catch (err) {
      setError('Failed to generate 2FA secret. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify the user's authentication code
  const verifyCode = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // In a real app, this would be an API call to verify the code
      // For demo purposes, we'll simulate it
      if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
        throw new Error('Invalid verification code');
      }
      
      // Generate mock backup codes
      const mockBackupCodes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );
      
      setBackupCodes(mockBackupCodes);
      setStep('backup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Complete the setup process
  const completeSetup = async () => {
    setIsLoading(true);
    try {
      await onComplete(secret, backupCodes);
    } catch (err) {
      setError('Failed to save 2FA settings. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Two-Factor Authentication Setup
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {step === 'generate' && (
        <div>
          <p className="text-gray-600 mb-4">
            Two-factor authentication adds an extra layer of security to your account. 
            Once enabled, you'll need both your password and a verification code from your 
            mobile device to sign in.
          </p>
          <Button 
            onClick={generateSecret} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Generating...' : 'Set Up Two-Factor Authentication'}
          </Button>
          <button 
            onClick={onCancel}
            className="mt-3 w-full text-center text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      )}
      
      {step === 'verify' && (
        <div>
          <p className="text-gray-600 mb-4">
            Scan this QR code with your authenticator app (like Google Authenticator, 
            Authy, or Microsoft Authenticator), then enter the verification code below.
          </p>
          
          <div className="flex justify-center mb-4">
            <QRCodeSVG value={qrCodeUrl} size={200} />
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">
              If you can't scan the QR code, enter this code manually in your app:
            </p>
            <div className="bg-gray-100 p-2 rounded font-mono text-sm break-all">
              {secret}
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              type="text"
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              maxLength={6}
            />
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={verifyCode} 
              disabled={isLoading || verificationCode.length !== 6}
              className="flex-1"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
            <Button 
              onClick={() => setStep('generate')} 
              variant="secondary"
              className="flex-1"
            >
              Back
            </Button>
          </div>
        </div>
      )}
      
      {step === 'backup' && (
        <div>
          <p className="text-gray-600 mb-4">
            Save these backup codes in a secure place. If you lose your device, you can use 
            these codes to access your account. Each code can only be used once.
          </p>
          
          <div className="bg-gray-100 p-3 rounded mb-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="font-mono text-sm">
                  {code}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center">
              <input
                id="confirmSaved"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                onChange={() => setIsLoading(false)}
              />
              <label htmlFor="confirmSaved" className="ml-2 block text-sm text-gray-900">
                I have saved these backup codes
              </label>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={completeSetup} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Completing...' : 'Complete Setup'}
            </Button>
            <Button 
              onClick={() => setStep('verify')} 
              variant="secondary"
              className="flex-1"
            >
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 