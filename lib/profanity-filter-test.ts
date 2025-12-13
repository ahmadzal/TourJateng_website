// Test file untuk profanity filter
// File: lib/profanity-filter-test.ts

import { filterProfanity, containsProfanity, countProfanity, getProfanityWords } from './profanity-filter'

// Test cases untuk filter profanity
console.log('=== TESTING PROFANITY FILTER ===')

// Test Bahasa Indonesia
console.log('\n--- Test Bahasa Indonesia ---')
console.log('Input: "kamu anjing bodoh"')
console.log('Output:', filterProfanity('kamu anjing bodoh'))
console.log('Contains profanity:', containsProfanity('kamu anjing bodoh'))

console.log('\nInput: "dasar bangsat tolol"')
console.log('Output:', filterProfanity('dasar bangsat tolol'))

// Test Bahasa Inggris  
console.log('\n--- Test Bahasa Inggris ---')
console.log('Input: "you are fucking stupid"')
console.log('Output:', filterProfanity('you are fucking stupid'))

console.log('\nInput: "what the hell is this shit"')
console.log('Output:', filterProfanity('what the hell is this shit'))

// Test Bahasa Jawa Tengah
console.log('\n--- Test Bahasa Jawa ---')
console.log('Input: "asu jancuk"')
console.log('Output:', filterProfanity('asu jancuk'))

console.log('\nInput: "kowe pekok tenan"')
console.log('Output:', filterProfanity('kowe pekok tenan'))

console.log('\nInput: "asuw asuk dongo"')
console.log('Output:', filterProfanity('asuw asuk dongo'))

// Test Kata Plesetan
console.log('\n--- Test Kata Plesetan ---')
console.log('Input: "anjay njir bjir pantek"')
console.log('Output:', filterProfanity('anjay njir bjir pantek'))

console.log('\nInput: "kamvret badjingan silit"')
console.log('Output:', filterProfanity('kamvret badjingan silit'))

console.log('\nInput: "bugil telanjang dongo"')
console.log('Output:', filterProfanity('bugil telanjang dongo'))

// Test Singkatan
console.log('\n--- Test Singkatan ---')
console.log('Input: "AJG KNTL BGST"')
console.log('Output:', filterProfanity('AJG KNTL BGST'))

console.log('\nInput: "ajg kntl bgst"')
console.log('Output:', filterProfanity('ajg kntl bgst'))

// Test Leetspeak/Perpaduan Teks
console.log('\n--- Test Leetspeak ---')
console.log('Input: "Bug1L 4JG"')
console.log('Output:', filterProfanity('Bug1L 4JG'))

console.log('\nInput: "4nj1ng b4ng54t k0nt0l"')
console.log('Output:', filterProfanity('4nj1ng b4ng54t k0nt0l'))

// Test Mixed Languages
console.log('\n--- Test Mixed Languages ---')
console.log('Input: "anjing fuck asu stupid"')
console.log('Output:', filterProfanity('anjing fuck asu stupid'))

// Test Edge Cases
console.log('\n--- Test Edge Cases ---')
console.log('Input: "ANJING" (uppercase)')
console.log('Output:', filterProfanity('ANJING'))

console.log('\nInput: "Anjing" (mixed case)')
console.log('Output:', filterProfanity('Anjing'))

console.log('\nInput: "halo semuanya" (no profanity)')
console.log('Output:', filterProfanity('halo semuanya'))
console.log('Contains profanity:', containsProfanity('halo semuanya'))

// Test word boundaries
console.log('\n--- Test Word Boundaries ---')
console.log('Input: "anjingkeren" (not a separate word)')
console.log('Output:', filterProfanity('anjingkeren'))

console.log('\nInput: "anjing keren" (separate words)')
console.log('Output:', filterProfanity('anjing keren'))

// Test counting
console.log('\n--- Test Counting ---')
console.log('Input: "anjing bodoh fuck stupid"')
console.log('Count:', countProfanity('anjing bodoh fuck stupid'))
console.log('Found words:', getProfanityWords('anjing bodoh fuck stupid'))

// Test short words
console.log('\n--- Test Short Words ---')
console.log('Input: "asu tai"')
console.log('Output:', filterProfanity('asu tai'))

console.log('=== TEST COMPLETED ===')

// Contoh penggunaan dalam aplikasi:
export const testExamples = {
  indonesian: [
    'Pemandangannya bagus sekali!', // Clean
    'Wah anjing, keren banget!', // Should filter 'anjing'
    'Dasar bangsat tolol!', // Should filter both
    'Tempat ini bagus untuk foto' // Clean
  ],
  english: [
    'This place is amazing!', // Clean
    'This fucking place is great!', // Should filter 'fucking'
    'What the hell is this shit?', // Should filter both
    'Beautiful sunset here' // Clean
  ],
  javanese: [
    'Apik tenan iki', // Clean
    'Asu, apik tenan!', // Should filter 'asu'
    'Kowe pekok jancuk!', // Should filter both
    'Omah apik iki' // Clean
  ],
  plesetan: [
    'Anjay keren banget!', // Should filter 'anjay'
    'Njir parah nih!', // Should filter 'njir'
    'Pantek lucu banget', // Should filter 'pantek'
    'Bagus banget fotonya' // Clean
  ],
  abbreviations: [
    'AJG keren banget', // Should filter 'AJG'
    'KNTL banget dah', // Should filter 'KNTL'
    'BGST parah nih', // Should filter 'BGST'
    'Mantap sekali ini' // Clean
  ],
  leetspeak: [
    'Bug1L banget nih', // Should filter 'Bug1L'
    '4JG keren abis', // Should filter '4JG'
    'K0nt0l banget', // Should filter 'K0nt0l'
    'Keren banget foto ini' // Clean
  ]
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  testExamples.indonesian.forEach((text, i) => {
    console.log(`\nIndonesian Test ${i + 1}:`)
    console.log(`Input: "${text}"`)
    console.log(`Output: "${filterProfanity(text)}"`)
    console.log(`Contains profanity: ${containsProfanity(text)}`)
  })
}