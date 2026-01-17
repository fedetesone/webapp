import Link from 'next/link';
import { Braces } from 'lucide-react';

const tools = [
  {
    id: 'es-query',
    name: 'ES Query Visualizer',
    description:
      'Paste Elasticsearch JSON queries and visualize them as an editable tree. Generate code for Java, Python, and cURL.',
    icon: <Braces className="w-8 h-8" />,
    href: '/tools/es-query',
    gradient: 'from-purple-500 to-blue-500',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">DevTools</h1>
        <p className="text-muted-foreground mb-8">
          Developer productivity tools that don&apos;t suck.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.02] hover:shadow-lg"
            >
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                {tool.icon}
              </div>
              <h2 className="text-lg font-semibold mb-2">{tool.name}</h2>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
