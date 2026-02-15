import { LoginForm } from './login-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Login - Feedback Hub',
    description: 'Login to your account to manage feedback.',
};

export default function LoginPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">Login</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Enter your email below to login to your account
                </p>
            </div>
            <LoginForm />
        </div>
    );
}
