'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { LoginForm } from '@/types';
import { ROUTES } from '@/constants';
import { isValidEmail } from '@/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setError('');
    
    const result = await login(data.email, data.password);
    if (!result.success) {
      setError(result.error || '로그인에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            로그인
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            온라인 면접 시스템에 로그인하세요
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card variant="shadow">
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <Input
                label="이메일"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email', {
                  required: '이메일을 입력해주세요.',
                  validate: value => isValidEmail(value) || '올바른 이메일 형식이 아닙니다.',
                })}
              />

              <Input
                label="비밀번호"
                type="password"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password', {
                  required: '비밀번호를 입력해주세요.',
                  minLength: {
                    value: 6,
                    message: '비밀번호는 최소 6자 이상이어야 합니다.',
                  },
                })}
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                로그인
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">또는</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  계정이 없으신가요?{' '}
                  <Link
                    href={ROUTES.REGISTER}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    회원가입
                  </Link>
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  <Link
                    href={ROUTES.HOME}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    홈으로 돌아가기
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 