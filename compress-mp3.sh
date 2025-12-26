#!/bin/bash

# Script để nén file MP3 giảm kích thước
# Sử dụng: ./compress-mp3.sh [bitrate] [input_file] [output_file]

BITRATE=${1:-128}  # Mặc định 128 kbps (có thể dùng 96, 128, 192)
INPUT_FILE=${2:-"public/Wednesday (Bloody Mary) (Kyrix Remix).mp3"}
OUTPUT_FILE=${3:-"public/Wednesday (Bloody Mary) (Kyrix Remix) - compressed.mp3"}

echo "🔊 Đang nén file MP3..."
echo "📥 Input: $INPUT_FILE"
echo "📤 Output: $OUTPUT_FILE"
echo "🎵 Bitrate: ${BITRATE}kbps"

# Kiểm tra ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg chưa được cài đặt!"
    echo ""
    echo "📦 Cài đặt ffmpeg bằng Homebrew:"
    echo "   brew install ffmpeg"
    echo ""
    echo "Hoặc cài đặt qua MacPorts:"
    echo "   sudo port install ffmpeg"
    exit 1
fi

# Nén file
ffmpeg -i "$INPUT_FILE" -b:a ${BITRATE}k -y "$OUTPUT_FILE" 2>&1 | grep -E "(Duration|bitrate|size)"

# Kiểm tra kích thước
if [ -f "$OUTPUT_FILE" ]; then
    ORIGINAL_SIZE=$(ls -lh "$INPUT_FILE" | awk '{print $5}')
    NEW_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    echo ""
    echo "✅ Hoàn thành!"
    echo "📊 Kích thước gốc: $ORIGINAL_SIZE"
    echo "📊 Kích thước mới: $NEW_SIZE"
    echo ""
    echo "💡 Để sử dụng file mới, cập nhật đường dẫn trong App.tsx:"
    echo "   const AUDIO_URL = \"/$(basename $OUTPUT_FILE)\";"
else
    echo "❌ Có lỗi xảy ra khi nén file!"
    exit 1
fi

