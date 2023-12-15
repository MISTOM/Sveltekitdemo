import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    let Products = [
        // list of shoe products
            {
                id: 1,
                name: 'Nike Air Max 90',
                price: 149.99,
                image: 'https://static.nike.com/a/images/t_PDP_864_v1/f_auto,b_rgb:f5f5f5/7f8b4e0b-5b1f-4e6f-9c0a-9d1c5d6b2b5e/air-max-90-shoe-6WmLXK.jpg',
                description: 'The Nike Air Max 90 stays true to its OG running roots with the iconic Waffle outsole, stitched overlays and classic, color-accented TPU plates. Retro colors celebrate the first generation while Max Air cushioning adds comfort to your journey.'
            },
            {
                id: 2,
                name: 'Nike Air Max 95',
                price: 169.99,
                image: 'https://static.nike.com/a/images/t_PDP_864_v1/f_auto,b_rgb:f5f5f5/6a4e6d7d-4d5b-4f0a-8d8b-2a7b6c1a8a0f/air-max-95-shoe-6WmLXK.jpg',
                description: 'The Nike Air Max 95 made its mark as the first shoe to include visible Nike Air cushioning in the forefoot. The Nike Air Max 95 OG Shoe energizes the iconic design with updated materials in a variety of textures and accents.'
            },
            {
                id: 3,
                name: 'Nike Air Max 97',
                price: 179.99,
                image: 'https://static.nike.com/a/images/t_PDP_864_v1/f_auto,b_rgb:f5f5f5/7e7c1b2d-2d9b-4e4d-8e3f-8e9a9e3c9b6a/air-max-97-shoe-6WmLXK.jpg',
                description: 'The Nike Air Max 97 keeps a sneaker icon going strong with the same design details that made it famous: water-ripple lines, reflective piping and full-length Max Air cushioning.'
            },
            {
                id: 4,
                name: 'Nike Air Max'
            }]
    return json(Products ,{
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        },
    });
}