import { useState } from 'react';
import type { FaqItem } from '../types';
import { Icon } from './Icon';

export function FaqList({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="faq-list">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <article className={`faq-item ${open ? 'is-open' : ''}`} key={item.question}>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`faq-answer-${index}`}
              onClick={() => setOpenIndex(open ? -1 : index)}
            >
              <span className="faq-item__number">{String(index + 1).padStart(2, '0')}</span>
              <strong>{item.question}</strong>
              <Icon name="chevron-down" size={20} />
            </button>
            <div className="faq-item__answer" id={`faq-answer-${index}`} hidden={!open}>
              <p>{item.answer}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
