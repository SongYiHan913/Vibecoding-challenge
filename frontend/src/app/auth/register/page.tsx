'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { CandidateRegistrationForm } from '@/types';
import { ROUTES, APPLIED_FIELDS } from '@/constants';
import { isValidEmail, isValidPhone, isStrongPassword } from '@/utils';

interface RegisterFormData extends CandidateRegistrationForm {
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuth();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    setSuccess('');
    
    const { confirmPassword, ...registerData } = data;
    const result = await registerUser(registerData);
    if (result.success) {
      setSuccess(result.message || '회원가입이 완료되었습니다.');
      setTimeout(() => {
        router.push(ROUTES.LOGIN);
      }, 2000);
    } else {
      setError(result.error || '회원가입에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            지원자 회원가입
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            온라인 면접을 위한 계정을 생성하세요
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

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
                  {success}
                </div>
              )}

              <Input
                label="이름"
                type="text"
                autoComplete="name"
                error={errors.name?.message}
                {...register('name', {
                  required: '이름을 입력해주세요.',
                  minLength: {
                    value: 2,
                    message: '이름은 최소 2자 이상이어야 합니다.',
                  },
                })}
              />

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
                label="전화번호"
                type="tel"
                placeholder="010-1234-5678"
                autoComplete="tel"
                error={errors.phone?.message}
                {...register('phone', {
                  required: '전화번호를 입력해주세요.',
                  validate: value => isValidPhone(value) || '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)',
                })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  경력 기간
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register('experience', {
                    required: '경력 기간을 입력해주세요.',
                    min: {
                      value: 0,
                      message: '경력 기간은 0년 이상이어야 합니다.',
                    },
                    max: {
                      value: 50,
                      message: '경력 기간은 50년 이하여야 합니다.',
                    },
                  })}
                />
                <p className="mt-1 text-sm text-gray-500">신입의 경우 0을 입력하세요</p>
                {errors.experience && (
                  <p className="mt-1 text-sm text-red-600">{errors.experience.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  지원 분야
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register('appliedField', {
                    required: '지원 분야를 선택해주세요.',
                  })}
                >
                  <option value="">지원 분야를 선택하세요</option>
                  <option value={APPLIED_FIELDS.JAVA}>Java 개발자</option>
                  <option value={APPLIED_FIELDS.CSHARP}>C# 개발자</option>
                </select>
                {errors.appliedField && (
                  <p className="mt-1 text-sm text-red-600">{errors.appliedField.message}</p>
                )}
              </div>

              <Input
                label="비밀번호"
                type="password"
                autoComplete="new-password"
                error={errors.password?.message}
                helperText="최소 8자, 대소문자, 숫자, 특수문자 포함"
                {...register('password', {
                  required: '비밀번호를 입력해주세요.',
                  validate: value => isStrongPassword(value) || '비밀번호는 최소 8자, 대소문자, 숫자, 특수문자를 포함해야 합니다.',
                })}
              />

              <Input
                label="비밀번호 확인"
                type="password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                                 {...register('confirmPassword', {
                  required: '비밀번호 확인을 입력해주세요.',
                  validate: value => value === password || '비밀번호가 일치하지 않습니다.',
                })}
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                회원가입
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <Link
                  href={ROUTES.LOGIN}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  로그인
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 