'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle>Hello World</CardTitle>
          <CardDescription>
            Next.js + TypeScript + Tailwind + shadcn/ui
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-4xl font-bold mb-4">{count}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => setCount(count + 1)}>It works</Button>
        </CardFooter>
      </Card>
    </main>
  );
}
