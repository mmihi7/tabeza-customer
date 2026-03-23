'use client'

export default function TailwindTest() {
  return (
    <div className="p-8 bg-blue-500 text-white rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Tailwind Test</h1>
      <p className="text-sm">If you see blue background and white text, Tailwind is working!</p>
      <button className="mt-4 px-4 py-2 bg-white text-blue-500 rounded hover:bg-gray-100">
        Test Button
      </button>
    </div>
  )
}
