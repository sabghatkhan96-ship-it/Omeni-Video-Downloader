import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'How do I download videos without watermarks from TikTok or Instagram?',
    answer: 'Simply copy the video link from the app (using the Share button -> Copy Link) and paste it into OmniStream. Our extractor automatically routes through clean stream endpoints to provide the original MP4 without overlay logos.'
  },
  {
    question: 'Where are downloaded videos saved on iPhone or Android devices?',
    answer: 'On iOS / iPhone, Safari saves files to your "Files" app inside the Downloads folder, from where you can tap the share icon and select "Save Video" to transfer to Photos. On Android, files are instantly stored in your primary "Downloads" folder and visible in Google Photos or Gallery.'
  },
  {
    question: 'Can I extract and download only the MP3 audio track?',
    answer: 'Yes! After pasting your link, switch to the "Audio (MP3)" tab on the results card. You can download 320kbps high-quality studio audio or lightweight MP3 tracks for music players and offline listening.'
  },
  {
    question: 'Is it completely free and unlimited?',
    answer: 'Yes, OmniStream is 100% free with no limits on the number of videos or audio tracks you can download. There are no subscriptions, paywalls, or registrations needed.'
  },
  {
    question: 'Why did my video link fail to extract?',
    answer: 'Most failures occur if the video is set to "Private" by the creator, age-restricted, or removed from the platform. Make sure the URL belongs to a public video and starts with http:// or https://.'
  },
  {
    question: 'Are downloaded videos stored or tracked on your servers?',
    answer: 'No. OmniStream does not host, store, or archive any videos on its servers. All media data is streamed ephemerally and directly between the source CDN and your browser.'
  }
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-neutral-200/60 dark:border-neutral-800/60">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <p className="text-xs uppercase tracking-widest font-semibold text-rose-600 dark:text-rose-400">
          Got Questions?
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white mt-1">
          Frequently Asked Questions
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
          Everything you need to know about formats, resolutions, and mobile saving.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
              >
                <span className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-500 transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
