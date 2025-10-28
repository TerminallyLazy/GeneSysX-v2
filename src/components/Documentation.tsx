import { Book, FileText, Code, ExternalLink } from 'lucide-react';

export default function Documentation() {
  const sections = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of GeneSysX and how to use its core features.',
      icon: Book,
      links: [
        { title: 'Quick Start Guide', href: '#' },
        { title: 'Basic Concepts', href: '#' },
        { title: 'Installation', href: '#' }
      ]
    },
    {
      title: 'API Reference',
      description: 'Detailed documentation of all available APIs and functions.',
      icon: Code,
      links: [
        { title: 'REST API', href: '#' },
        { title: 'Python SDK', href: '#' },
        { title: 'R Package', href: '#' }
      ]
    },
    {
      title: 'Tutorials',
      description: 'Step-by-step guides for common bioinformatics workflows.',
      icon: FileText,
      links: [
        { title: 'Sequence Analysis', href: '#' },
        { title: 'Phylogenetic Trees', href: '#' },
        { title: 'Protein Structure', href: '#' }
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Documentation</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Welcome to the GeneSysX documentation. Here you'll find comprehensive guides and documentation to help you start working with GeneSysX as quickly as possible.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {section.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {section.description}
                  </p>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.title}>
                        <a
                          href={link.href}
                          className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          {link.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Updates</h3>
          <div className="space-y-4">
            {[
              {
                version: 'v1.2.0',
                date: '2024-03-15',
                changes: [
                  'Added support for multiple sequence alignment',
                  'Improved protein structure visualization',
                  'Enhanced performance for large datasets'
                ]
              },
              {
                version: 'v1.1.0',
                date: '2024-02-28',
                changes: [
                  'Introduced dark mode support',
                  'Added new analysis tools',
                  'Fixed various bugs and improved stability'
                ]
              }
            ].map((update) => (
              <div key={update.version} className="border-l-4 border-indigo-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {update.version}
                  </h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {update.date}
                  </span>
                </div>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                  {update.changes.map((change, index) => (
                    <li key={index}>{change}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}