import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Youtube from '@tiptap/extension-youtube';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Link as LinkIcon, Image as ImageIcon, Undo, Redo, Plus, Video } from 'lucide-react';
import { marked } from 'marked';
import { uploadFile } from '../lib/storage';
import './RichTextEditor.css';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
    const [showMediaMenu, setShowMediaMenu] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    if (!editor) {
        return null;
    }

    const addGenericVideo = () => {
        const url = prompt('Enter Video URL (YouTube, Vimeo, etc.)');
        if (url) {
            if (url.includes('youtube') || url.includes('youtu.be')) {
                editor.commands.setYoutubeVideo({ src: url });
            } else {
                alert('Currently only YouTube links are fully supported with the video player. We are adding generic support soon!');
            }
            setShowMediaMenu(false);
        }
    };

    const triggerImageUpload = () => {
        fileInputRef.current?.click();
        setShowMediaMenu(false);
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                // Show loading state (optional, but good UX)
                // For now, we'll just rely on the async nature

                const publicUrl = await uploadFile(file);

                if (publicUrl) {
                    editor.chain().focus().setImage({ src: publicUrl }).run();
                }
            } catch (error) {
                console.error("Image upload failed:", error);
                alert("Failed to upload image. Please check your connection or try a smaller file.");
            } finally {
                // Reset input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        }
    };

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) return;

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <div className="flex flex-wrap gap-2 p-2 border-b border-gray-200 bg-white sticky top-0 z-50 items-center">
            <button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-100 text-black font-bold' : 'text-gray-500'}`} title="Bold"><Bold size={18} /></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-100 text-black' : 'text-gray-500'}`} title="Italic"><Italic size={18} /></button>

            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>

            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-100 text-black' : 'text-gray-500'}`} title="Heading 1"><Heading1 size={18} /></button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-100 text-black' : 'text-gray-500'}`} title="Heading 2"><Heading2 size={18} /></button>

            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>

            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bulletList') ? 'bg-gray-100 text-black' : 'text-gray-500'}`} title="Bullet List"><List size={18} /></button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('orderedList') ? 'bg-gray-100 text-black' : 'text-gray-500'}`} title="Ordered List"><ListOrdered size={18} /></button>

            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>

            <button onClick={setLink} className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('link') ? 'bg-gray-100 text-black' : 'text-gray-500'}`} title="Link"><LinkIcon size={18} /></button>

            {/* Media Menu */}
            <div className="relative">
                <button
                    onClick={() => setShowMediaMenu(!showMediaMenu)}
                    className={`p-2 rounded hover:bg-gray-100 ${showMediaMenu ? 'bg-gray-100 text-black' : 'text-gray-500'} flex items-center gap-1`}
                    title="Add Media"
                >
                    <Plus size={18} />
                </button>

                {showMediaMenu && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-1 flex flex-col min-w-[150px] z-50">
                        <button onClick={triggerImageUpload} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded text-left text-sm text-gray-700">
                            <ImageIcon size={16} /> Upload Image
                        </button>
                        <button onClick={addGenericVideo} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded text-left text-sm text-gray-700">
                            <Video size={16} /> Embed Video
                        </button>
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                />
            </div>

            <div className="flex-1"></div>

            <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} className="p-2 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-50" title="Undo"><Undo size={18} /></button>
            <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} className="p-2 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-50" title="Redo"><Redo size={18} /></button>
        </div>
    );
};

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
    // Convert initial Markdown to HTML for TipTap
    // TipTap handles HTML content natively, ensuring WYSIWYG
    const initialHtml = marked.parse(content || '', { async: false });

    const editor = useEditor({
        extensions: [
            StarterKit,
            Markdown,
            Placeholder.configure({
                placeholder: placeholder || 'Start writing your lesson content...',
            }),
            Youtube.configure({
                controls: false,
            }),
            Image,
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: initialHtml,
        onUpdate: ({ editor }) => {
            // Return Markdown so it stays compatible with the rest of the app
            onChange((editor.storage as any).markdown.getMarkdown());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm mx-auto focus:outline-none min-h-[150px] p-4 max-w-none',
            },
        },
    });

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col h-full">
            <MenuBar editor={editor} />
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
