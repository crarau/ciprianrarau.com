#!/usr/bin/env node

/* eslint-disable */
// This is a utility script - disable all ESLint rules

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const crypto = require('crypto')

// Configuration - adapted for ciprianrarau-site structure
const BLOG_DIR = path.join(__dirname, '../src/data/post')
const IMAGES_DIR = path.join(__dirname, '../public/images/diagrams')
const PUBLIC_IMAGES_DIR = path.join(__dirname, '../public/images')
const MERMAID_FOOTER_DIR = path.join(__dirname, 'mermaid-footer')

// Command line arguments
const args = process.argv.slice(2)
const FORCE_REGENERATE = args.includes('--force')

// Regex to find all mermaid diagrams - always regenerate images
const MERMAID_REGEX = /```mermaid\n([\s\S]*?)\n```/g

// Ensure diagrams directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true })
}

// Function to parse frontmatter and extract author
function extractAuthorFromFrontmatter(content) {
  // Match YAML frontmatter at the beginning of the file
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) {
    console.log('  ⚠️  No frontmatter found')
    return null
  }
  
  const frontmatter = frontmatterMatch[1]
  
  // Extract author field (handles various formats)
  const authorMatch = frontmatter.match(/^author:\s*(.+)$/m)
  if (!authorMatch) {
    console.log('  ⚠️  No author field found in frontmatter')
    return null
  }
  
  const author = authorMatch[1].trim().replace(/^["']|["']$/g, '') // Remove quotes if present
  console.log(`  👤 Found author: ${author}`)
  return author
}

// Function to convert author name to footer filename format
function authorToFilename(authorName) {
  if (!authorName) return null
  
  // Convert "Ciprian Rarau" to "ciprian-rarau"
  return authorName
    .toLowerCase()
    .replace(/\([^)]*\)/g, '') // Remove parentheses and content
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
}

// Function to get author-specific footer path
function getAuthorFooterPath(author) {
  if (!author) return null
  
  const footerFilename = authorToFilename(author)
  if (!footerFilename) return null
  
  const footerPath = path.join(MERMAID_FOOTER_DIR, `${footerFilename}.png`)
  
  if (fs.existsSync(footerPath)) {
    console.log(`  🎯 Using author footer: ${footerFilename}.png`)
    return footerPath
  } else {
    console.log(`  ⚠️  Author footer not found: ${footerPath}`)
    console.log(`      Looking for: ${footerFilename}.png`)
    console.log(`      Available footers: ${fs.existsSync(MERMAID_FOOTER_DIR) ? 
      fs.readdirSync(MERMAID_FOOTER_DIR).filter(f => f.endsWith('.png')).join(', ') : 'directory not found'
    }`)
    return null
  }
}

// Function to convert image to Base64
function convertImageToBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath)
    const imageExtension = path.extname(imagePath).toLowerCase()
    let mimeType = 'image/png' // default
    
    // Determine MIME type based on extension
    switch (imageExtension) {
      case '.png':
        mimeType = 'image/png'
        break
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg'
        break
      case '.gif':
        mimeType = 'image/gif'
        break
      case '.svg':
        mimeType = 'image/svg+xml'
        break
      case '.webp':
        mimeType = 'image/webp'
        break
    }
    
    const base64Data = imageBuffer.toString('base64')
    return `data:${mimeType};base64,${base64Data}`
  } catch (error) {
    console.warn(`⚠️  Could not convert image ${imagePath} to Base64: ${error.message}`)
    return null
  }
}

// Function to process images in mermaid code and convert them to Base64
function processImagesInMermaidCode(mermaidCode) {
  // Regex to find img tags with src attributes starting with /image/ or /images/
  const imageRegex = /<img\s+[^>]*src=['"]\/images?\/([^'"]+)['"][^>]*>/g
  
  let processedCode = mermaidCode
  let match
  
  while ((match = imageRegex.exec(mermaidCode)) !== null) {
    const originalTag = match[0]
    const imagePath = match[1] // e.g., "logo.png"
    const fullImagePath = path.join(PUBLIC_IMAGES_DIR, imagePath)
    
    console.log(`  🖼️  Processing image: /images/${imagePath}`)
    
    // Check if the image file exists
    if (fs.existsSync(fullImagePath)) {
      const base64Data = convertImageToBase64(fullImagePath)
      
      if (base64Data) {
        // Replace the src attribute with Base64 data
        const updatedTag = originalTag.replace(
          /src=['"]\/images?\/[^'"]+['"]/,
          `src="${base64Data}"`
        )
        
        processedCode = processedCode.replace(originalTag, updatedTag)
        console.log(`  ✅ Converted image to Base64: ${imagePath}`)
      } else {
        console.warn(`  ❌ Failed to convert image to Base64: ${imagePath}`)
      }
    } else {
      console.warn(`  ❌ Image file not found: ${fullImagePath}`)
    }
  }
  
  return processedCode
}

// Function to generate hash from mermaid content
function generateContentHash(content) {
  // Process images to include Base64 data in hash calculation
  const processedContent = processImagesInMermaidCode(content)
  return crypto.createHash('sha256').update(processedContent.trim()).digest('hex').substring(0, 8)
}

// Function to generate hash of this script file for cache busting
function generateScriptHash() {
  try {
    const scriptPath = __filename
    const scriptContent = fs.readFileSync(scriptPath, 'utf8')
    const scriptHash = crypto.createHash('sha256').update(scriptContent).digest('hex').substring(0, 8)
    return scriptHash
  } catch (error) {
    console.warn(`  ⚠️  Could not generate script hash: ${error.message}`)
    // Fallback to a static value if we can't read the script
    return 'fallback'
  }
}

// Function to scan all blog files and collect expected diagram hashes
function collectExpectedHashes() {
  console.log('🔍 Scanning blog files to collect expected diagram hashes...')
  
  const expectedHashes = new Set()
  const blogFiles = fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .map((file) => path.join(BLOG_DIR, file))

  blogFiles.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8')
    const baseName = path.basename(filePath, path.extname(filePath))
    let match
    
    while ((match = MERMAID_REGEX.exec(content)) !== null) {
      const mermaidCode = match[1].trim()
      const contentHash = generateContentHash(mermaidCode)
      const filename = `${baseName}-diagram-${contentHash}.png`
      expectedHashes.add(filename)
    }
  })
  
  console.log(`  📊 Found ${expectedHashes.size} expected diagram files`)
  return expectedHashes
}

// Function to clean up orphaned diagram images
function cleanupOrphanedDiagrams(expectedHashes) {
  console.log('🧹 Cleaning up orphaned diagram images...')
  
  try {
    const files = fs.readdirSync(IMAGES_DIR)
    const diagramFiles = files.filter(file => file.endsWith('.png') && file.includes('diagram'))
    let deletedCount = 0
    
    diagramFiles.forEach(file => {
      if (!expectedHashes.has(file)) {
        const filePath = path.join(IMAGES_DIR, file)
        fs.unlinkSync(filePath)
        console.log(`  🗑️  Deleted orphaned: ${file}`)
        deletedCount++
      }
    })
    
    console.log(`✅ Cleaned up ${deletedCount} orphaned diagram files`)
  } catch (error) {
    console.warn(`⚠️  Error cleaning up orphaned diagrams: ${error.message}`)
  }
}

// Function to check if mermaid CLI is available
function checkMermaidCLI() {
  try {
    execSync('mmdc --version', { stdio: 'pipe' })
    console.log('✅ Mermaid CLI is available')
    return true
  } catch (error) {
    console.log('❌ Mermaid CLI not found. Please install it globally first.')
    console.log('Run: npm install -g @mermaid-js/mermaid-cli')
    return false
  }
}

// Function to check if ImageMagick is available
function checkImageMagick() {
  try {
    execSync('magick -version', { stdio: 'pipe' })
    console.log('✅ ImageMagick is available for image stitching')
    return true
  } catch (error) {
    try {
      execSync('convert -version', { stdio: 'pipe' })
      console.log('✅ ImageMagick (legacy) is available for image stitching')
      return 'legacy'
    } catch (error2) {
      console.log('⚠️  ImageMagick not found. Footer stitching disabled.')
      console.log('   Install ImageMagick for automatic footer stitching.')
      return false
    }
  }
}

// Function to get image dimensions
function getImageDimensions(imagePath) {
  try {
    const imageMagick = checkImageMagick()
    if (!imageMagick) return null
    
    const command = imageMagick === 'legacy' 
      ? `identify -format "%wx%h" "${imagePath}"`
      : `magick identify -format "%wx%h" "${imagePath}"`
    
    const output = execSync(command, { stdio: 'pipe' }).toString().trim()
    const [width, height] = output.split('x').map(Number)
    return { width, height }
  } catch (error) {
    console.warn(`  ⚠️  Failed to get image dimensions: ${error.message}`)
    return null
  }
}

// Function to pad image to target width while maintaining aspect ratio
function padImageToWidth(sourcePath, targetWidth, outputPath, isFooter = false) {
  const imageMagick = checkImageMagick()
  if (!imageMagick) return false
  
  try {
    // Get current image dimensions
    const dimensions = getImageDimensions(sourcePath)
    if (!dimensions) {
      console.log(`  ❌ Could not get ${isFooter ? 'footer' : 'diagram'} dimensions`)
      return false
    }
    
    console.log(`  📏 ${isFooter ? 'Footer' : 'Diagram'} source: ${dimensions.width}x${dimensions.height}`)
    
    if (dimensions.width === targetWidth) {
      // Already the right width, just copy
      fs.copyFileSync(sourcePath, outputPath)
      console.log(`  ✅ ${isFooter ? 'Footer' : 'Diagram'} width matches target`)
      return true
    }
    
    if (dimensions.width > targetWidth) {
      console.log(`  ⚠️  ${isFooter ? 'Footer' : 'Diagram'} is wider than target, this shouldn't happen`)
      fs.copyFileSync(sourcePath, outputPath)
      return true
    }
    
    // Center the image in a canvas of the target width with white background
    const command = imageMagick === 'legacy' 
      ? `convert "${sourcePath}" -background white -gravity center -extent ${targetWidth}x${dimensions.height} "${outputPath}"`
      : `magick "${sourcePath}" -background white -gravity center -extent ${targetWidth}x${dimensions.height} "${outputPath}"`
    
    execSync(command, { stdio: 'pipe' })
    console.log(`  🎯 Padded ${isFooter ? 'footer' : 'diagram'}: ${dimensions.width}px → ${targetWidth}px`)
    return true
  } catch (error) {
    console.warn(`  ⚠️  Failed to pad ${isFooter ? 'footer' : 'diagram'}: ${error.message}`)
    return false
  }
}

// Function to stitch diagram with footer
function stitchWithFooter(diagramPath, outputPath, authorFooterPath = null) {
  const imageMagick = checkImageMagick()
  
  if (!imageMagick) {
    // Just copy the original if no ImageMagick available
    if (diagramPath !== outputPath) {
      fs.copyFileSync(diagramPath, outputPath)
    }
    return false
  }
  
  try {
    // Get the width of the diagram
    const dimensions = getImageDimensions(diagramPath)
    if (!dimensions) {
      console.log('  ⚠️  Could not determine diagram width, using original')
      if (diagramPath !== outputPath) {
        fs.copyFileSync(diagramPath, outputPath)
      }
      return false
    }
    
    const diagramDimensions = dimensions
    console.log(`  📐 Diagram dimensions: ${diagramDimensions.width}x${diagramDimensions.height}`)
    
    // Use author-specific footer or fallback to default
    let sourceFooterPath = authorFooterPath
    
    if (!sourceFooterPath || !fs.existsSync(sourceFooterPath)) {
      // Fallback to default footer
      sourceFooterPath = path.join(PUBLIC_IMAGES_DIR, 'mermaid-footer.png')
      if (!fs.existsSync(sourceFooterPath)) {
        console.log('  ⚠️  No footer image found, using original diagram')
        if (!authorFooterPath) {
          console.log('      No author-specific footer available')
        }
        console.log(`      Fallback footer not found: ${sourceFooterPath}`)
        if (diagramPath !== outputPath) {
          fs.copyFileSync(diagramPath, outputPath)
        }
        return false
      } else {
        console.log('  📄 Using fallback footer: mermaid-footer.png')
      }
    }
    
    // Get footer dimensions
    const footerDimensions = getImageDimensions(sourceFooterPath)
    if (!footerDimensions) {
      console.log('  ⚠️  Could not get footer dimensions, using original diagram')
      if (diagramPath !== outputPath) {
        fs.copyFileSync(diagramPath, outputPath)
      }
      return false
    }
    
    console.log(`  📐 Footer dimensions: ${footerDimensions.width}x${footerDimensions.height}`)
    
    // Determine the target width (maximum of diagram and footer widths)
    const targetWidth = Math.max(diagramDimensions.width, footerDimensions.width)
    console.log(`  🎯 Target width: ${targetWidth}px`)
    
    // Create padded versions if needed
    const paddedDiagramPath = path.join(__dirname, `diagram-padded-${targetWidth}.png`)
    const paddedFooterPath = path.join(__dirname, `footer-padded-${targetWidth}.png`)
    
    // Pad diagram to target width if needed
    const diagramPadded = padImageToWidth(diagramPath, targetWidth, paddedDiagramPath, false)
    if (!diagramPadded) {
      console.log('  ⚠️  Failed to pad diagram, using original')
      if (diagramPath !== outputPath) {
        fs.copyFileSync(diagramPath, outputPath)
      }
      return false
    }
    
    // Pad footer to target width if needed
    const footerPadded = padImageToWidth(sourceFooterPath, targetWidth, paddedFooterPath, true)
    if (!footerPadded) {
      console.log('  ⚠️  Failed to pad footer, using original diagram')
      if (diagramPath !== outputPath) {
        fs.copyFileSync(diagramPath, outputPath)
      }
      // Clean up diagram if created
      if (fs.existsSync(paddedDiagramPath)) {
        fs.unlinkSync(paddedDiagramPath)
      }
      return false
    }
    
    // Stitch the padded images
    const command = imageMagick === 'legacy' 
      ? `convert "${paddedDiagramPath}" "${paddedFooterPath}" -append "${outputPath}"`
      : `magick "${paddedDiagramPath}" "${paddedFooterPath}" -append "${outputPath}"`
    
    execSync(command, { stdio: 'pipe' })
    console.log('  🔗 Stitched diagram with properly aligned footer')
    
    // Clean up temporary padded images
    if (fs.existsSync(paddedDiagramPath)) {
      fs.unlinkSync(paddedDiagramPath)
    }
    if (fs.existsSync(paddedFooterPath)) {
      fs.unlinkSync(paddedFooterPath)
    }
    
    return true
  } catch (error) {
    console.warn(`  ⚠️  Failed to stitch footer: ${error.message}`)
    // Fallback: copy original
    if (diagramPath !== outputPath) {
      fs.copyFileSync(diagramPath, outputPath)
    }
    return false
  }
}

// Function to convert mermaid to image
function convertMermaidToImage(mermaidCode, outputPath, authorFooterPath = null) {
  const tempMermaidFile = path.join(__dirname, 'temp-diagram.mmd')
  const configFile = path.join(__dirname, 'mermaid-config.json')
  const tempOutputPath = outputPath.replace('.png', '-temp.png')

  try {
    // Process images in mermaid code and convert them to Base64
    const processedMermaidCode = processImagesInMermaidCode(mermaidCode)
    
    // Create mermaid config with puppeteer settings and width constraints
    const config = {
      theme: 'neutral',
      background: 'white',
      width: 1200,
      height: 800,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        nodeSpacing: 30,
        rankSpacing: 40,
        padding: 15
      },
      puppeteerConfig: {
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      }
    }
    
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2))
    fs.writeFileSync(tempMermaidFile, processedMermaidCode)
    
    // Generate the base diagram first
    const command = `mmdc -i "${tempMermaidFile}" -o "${tempOutputPath}" -c "${configFile}" --scale 2 --width 1200 --height 800`
    execSync(command, { stdio: 'pipe' })
    
    // Stitch with author-specific footer
    const stitched = stitchWithFooter(tempOutputPath, outputPath, authorFooterPath)
    
    // Clean up temp diagram
    if (fs.existsSync(tempOutputPath)) {
      fs.unlinkSync(tempOutputPath)
    }
    
    const footerInfo = stitched ? 
      (authorFooterPath ? ' (with author footer)' : ' (with fallback footer)') : 
      ''
    console.log(`✅ Generated: ${path.basename(outputPath)}${footerInfo}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to generate ${path.basename(outputPath)}:`, error.message)
    return false
  } finally {
    // Clean up temp files
    if (fs.existsSync(tempMermaidFile)) {
      fs.unlinkSync(tempMermaidFile)
    }
    if (fs.existsSync(configFile)) {
      fs.unlinkSync(configFile)
    }
    if (fs.existsSync(tempOutputPath)) {
      fs.unlinkSync(tempOutputPath)
    }
  }
}

// Function to process a single markdown file
function processMarkdownFile(filePath) {
  console.log(`\n📄 Processing: ${path.basename(filePath)}`)
  
  const content = fs.readFileSync(filePath, 'utf8')
  const baseName = path.basename(filePath, path.extname(filePath))
  let updatedContent = content
  let diagramCount = 0
  
  // Extract author from frontmatter
  const author = extractAuthorFromFrontmatter(content)
  const authorFooterPath = getAuthorFooterPath(author)
  
  if (FORCE_REGENERATE) {
    console.log('  🔄 Force regeneration enabled - will recreate all diagrams')
  }
  
  // Find all mermaid diagrams and collect them
  const matches = []
  let match
  
  while ((match = MERMAID_REGEX.exec(content)) !== null) {
    matches.push({
      fullMatch: match[0],
      mermaidCode: match[1].trim(),
      index: match.index
    })
  }
  
  // Process matches in reverse order to avoid index shifting
  matches.reverse().forEach((matchData) => {
    diagramCount++
    
    // Generate hash-based filename
    const contentHash = generateContentHash(matchData.mermaidCode)
    const filename = `${baseName}-diagram-${contentHash}.png`
    const imagePath = path.join(IMAGES_DIR, filename)
    const relativeImagePath = `/images/diagrams/${filename}`
    
    // Generate image if it doesn't exist OR if force regeneration is enabled
    let imageGenerated = false
    const shouldGenerate = !fs.existsSync(imagePath) || FORCE_REGENERATE
    
    if (shouldGenerate) {
      imageGenerated = convertMermaidToImage(matchData.mermaidCode, imagePath, authorFooterPath)
      if (imageGenerated) {
        const reason = FORCE_REGENERATE ? 'force regenerated' : 'generated new'
        console.log(`  📊 ${reason} diagram ${diagramCount} (hash: ${contentHash})`)
      }
    } else {
      console.log(`  ⏩ Skipped diagram ${diagramCount} (already exists, hash: ${contentHash})`)
      imageGenerated = true // Consider it "generated" for processing purposes
    }
    
    if (imageGenerated) {
      // Add cache-busting script hash to image URL (only changes when script logic changes)
      const scriptHash = generateScriptHash()
      const cacheBustedImagePath = `${relativeImagePath}?v=${scriptHash}`
      
      // Check if there's already an image reference after this mermaid block
      const afterMermaidIndex = matchData.index + matchData.fullMatch.length
      const afterMermaidContent = updatedContent.substring(afterMermaidIndex, afterMermaidIndex + 200)
      // Updated regex to match both numbered and hash-based diagram references with optional query params
      const existingImageMatch = afterMermaidContent.match(/^\s*\n\s*!\[Diagram [^\]]*\]\([^)]+\)/)
      
      if (existingImageMatch) {
        // Update existing image reference with script-based cache busting
        const newImageRef = `![Diagram ${diagramCount}](${cacheBustedImagePath})`
        updatedContent = updatedContent.substring(0, afterMermaidIndex) + 
                        afterMermaidContent.replace(existingImageMatch[0], `\n\n${newImageRef}`) +
                        updatedContent.substring(afterMermaidIndex + afterMermaidContent.length)
        console.log(`  🔄 Updated diagram ${diagramCount} image reference (script hash: ${scriptHash})`)
      } else {
        // Add new image reference with script-based cache busting - KEEP the mermaid source
        const replacement = `${matchData.fullMatch}\n\n![Diagram ${diagramCount}](${cacheBustedImagePath})`
        updatedContent = updatedContent.substring(0, matchData.index) + 
                        replacement + 
                        updatedContent.substring(matchData.index + matchData.fullMatch.length)
        console.log(`  ➕ Added diagram ${diagramCount} image reference (script hash: ${scriptHash})`)
      }
    }
  })
  
  // Write updated content if changes were made
  if (updatedContent !== content) {
    fs.writeFileSync(filePath, updatedContent)
    console.log(`  ✅ Updated markdown file with ${diagramCount} diagram(s)`)
  } else if (diagramCount === 0) {
    console.log(`  ℹ️  No mermaid diagrams found`)
  }
  
  return diagramCount
}

// Main function
function main() {
  console.log('🚀 Starting Mermaid Diagram Processing...\n')
  
  // Show usage if help requested
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node process-mermaid-diagrams.js [options]')
    console.log('Options:')
    console.log('  --force    Force regeneration of all diagrams even if hash unchanged')
    console.log('  --help     Show this help message')
    console.log('')
    console.log('Features:')
    console.log('  📊 Automatically extracts author from markdown frontmatter')
    console.log('  🎯 Uses author-specific footer from mermaid-footer directory')
    console.log('  🔄 Smart hash-based caching (unless --force is used)')
    process.exit(0)
  }

  // Check if mermaid-cli is available
  if (!checkMermaidCLI()) {
    process.exit(1)
  }

  // Check for footer capability
  checkImageMagick()
  
  if (FORCE_REGENERATE) {
    console.log('⚡ Force regeneration mode enabled')
  }

  // Collect expected diagram hashes from all blog files
  const expectedHashes = collectExpectedHashes()

  // Clean up orphaned diagram images
  cleanupOrphanedDiagrams(expectedHashes)

  // Find all markdown files in blog directory
  const blogFiles = fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .map((file) => path.join(BLOG_DIR, file))

  console.log(`\n📁 Found ${blogFiles.length} blog post(s) to process\n`)

  let totalDiagrams = 0
  blogFiles.forEach((filePath) => {
    totalDiagrams += processMarkdownFile(filePath)
  })

  console.log(`\n🎉 Processing complete!`)
  console.log(`   📊 Total diagrams processed: ${totalDiagrams}`)
  console.log(`   📁 Images saved to: ${path.relative(process.cwd(), IMAGES_DIR)}`)
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = { processMarkdownFile, convertMermaidToImage }