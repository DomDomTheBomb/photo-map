import { useState } from 'react';

import Dialog from '../ui/Dialog';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../ui/spinner/spinner';

export default function LoginForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleLogin(e) {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await signIn(email, password);
    if (error) setError(error.message);

    setSubmitting(false);
  }

  return (
    <Dialog isOpen={true}>
      <form onSubmit={handleLogin} className="flex justify-center w-full">
        <div className="flex flex-col text-center w-[60%]">
          <span className="mb-4 text-3xl"> Login </span>

          {/* email input */}
          <input
            className="field-inputs border rounded-sm mb-2 pl-2"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {/* password input */}
          <input
            className="field-inputs border rounded-sm mb-2 pl-2"
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            className="bg-primary text-white text-sm py-1 rounded-sm"
            type="submit"
            disabled={submitting}
          >
            { submitting ? (<Spinner size='12px' thickness='1.5px' />) : 'Sign In'}
          </button>
          {/* display error when applicable */}
          { error && (<span className="text-left mt-1 text-xs text-red-500"> *{error} </span>)}
        </div>
      </form>
    </Dialog>
  );
}
