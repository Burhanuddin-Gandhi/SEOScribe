# Executive PDF Parser Benchmark & Evaluation Report

**Date:** 2026-09-01  
**Project:** SEOScribe (Feature 1 - Client PDF Ingestion Pipeline)  

## 1. Executive Summary

This report compares PDF parsing engines on real-world client SEO documents across structural fidelity, OCR ability, latency, and cost.

## 2. Benchmark Results Table

| Document | Engine | Latency | Words | Headings (H1/H2/H3) | Tables | Bullets | SEO Score | Est. Cost |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 20210602-About-us(Type-1).pdf | **LlamaParse** | 7239ms | 799 | 5/2/0 | 5 | 29 | **96/100** | $0.0150 |
| 20210602-About-us(Type-1).pdf | Gemini_2.5_Flash | FAILED | - | - | - | - | - | - |
| coffee-shop-website-plan(Type-2).pdf | **LlamaParse** | 24323ms | 1840 | 19/7/0 | 28 | 117 | **96/100** | $0.0210 |
| coffee-shop-website-plan(Type-2).pdf | **Gemini_2.5_Flash** | 23537ms | 1775 | 1/17/7 | 28 | 117 | **96/100** | $0.0000 |
| internship report scanned copy(Type-5).pdf | **LlamaParse** | 129117ms | 5868 | 31/16/1 | 203 | 48 | **96/100** | $0.1230 |
| internship report scanned copy(Type-5).pdf | **Gemini_2.5_Flash** | 135355ms | 5111 | 1/34/22 | 125 | 50 | **96/100** | $0.0000 |
| Leveraging-Your-Orgs-Thought-Leadership-Whitepaper(Type-3).pdf | **LlamaParse** | 70213ms | 7463 | 26/6/3 | 125 | 49 | **96/100** | $0.0900 |
| Leveraging-Your-Orgs-Thought-Leadership-Whitepaper(Type-3).pdf | Gemini_2.5_Flash | FAILED | - | - | - | - | - | - |
| Sample+SEO+Report+Portfolio(actual Type 4).pdf | **LlamaParse** | 42268ms | 3240 | 6/15/0 | 30 | 13 | **96/100** | $0.0300 |
| Sample+SEO+Report+Portfolio(actual Type 4).pdf | **Gemini_2.5_Flash** | 40762ms | 3146 | 1/7/12 | 33 | 24 | **96/100** | $0.0000 |
| SEO SAmple Report(Type-4).pdf | **LlamaParse** | 63966ms | 3504 | 18/36/4 | 215 | 9 | **96/100** | $0.0480 |
| SEO SAmple Report(Type-4).pdf | **Gemini_2.5_Flash** | 57639ms | 3304 | 9/23/0 | 131 | 20 | **96/100** | $0.0000 |

## 3. Engineering Recommendations for Leadership

1. **Primary Parsing Engine**: For rich website drafts, SEO audit tables, and whitepapers, **LlamaParse** outputs clean Markdown with semantic heading hierarchies.
2. **Fallback Strategy**: Retain **Local Baseline** for simple single-column documents to maintain zero unit-cost where appropriate.
3. **OCR Documents (Type 5)**: Only Cloud Vision/OCR engines successfully extract text from scanned files.
