import { notFound } from 'next/navigation'

/** Unknown URLs get a real 404 instead of a page that pretends to exist. */
export default function CatchAll() {
  notFound()
}
