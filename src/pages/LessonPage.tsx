import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Edit2, Save, X, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card } from '../components/Card';
import { useProgram } from '../context/ProgramContext';
import './LessonPage.css';

export function LessonPage() {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const { currentProgram } = useProgram();

    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');

    if (!currentProgram) return <div className="p-8">Loading program...</div>;

    // Find the lesson and module
    let currentLesson: any = null;
    let currentModule: any = null;
    let lessonIndex = -1;
    let allLessons: any[] = [];

    currentProgram.learningPath.forEach((module: any) => {
        module.lessons.forEach((lesson: any, idx: number) => {
            allLessons.push({ ...lesson, moduleId: module.id, moduleTitle: module.title });
            if (lesson.title === lessonId || `${module.id}-${idx}` === lessonId) {
                currentLesson = lesson;
                currentModule = module;
                lessonIndex = allLessons.length - 1;
            }
        });
    });

    if (!currentLesson) {
        return (
            <div className="lesson-page">
                <Card>
                    <p>Lesson not found</p>
                    <Link to="/path">Back to Learning Path</Link>
                </Card>
            </div>
        );
    }

    const prevLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
    const nextLesson = lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : null;

    const handleEdit = () => {
        setEditedContent(currentLesson.content || '');
        setIsEditing(true);
    };

    const handleSave = () => {
        // TODO: Save to database/context
        console.log('Saving edited content:', editedContent);
        currentLesson.content = editedContent;
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedContent('');
    };

    return (
        <div className="lesson-page">
            {/* Breadcrumb */}
            <div className="breadcrumb">
                <Link to="/path">Learning Path</Link>
                <span>/</span>
                <span>{currentModule.title}</span>
                <span>/</span>
                <span className="active">{currentLesson.title}</span>
            </div>

            {/* Main Content */}
            <Card className="lesson-card">
                <div className="lesson-header">
                    <div>
                        <span className="lesson-meta">{currentLesson.type} • {currentLesson.duration}</span>
                        <h1>{currentLesson.title}</h1>
                    </div>
                    {!isEditing && (
                        <button className="btn-secondary" onClick={handleEdit}>
                            <Edit2 size={18} />
                            Edit Lesson
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="editor-container">
                        <div className="editor-toolbar">
                            <span className="toolbar-label">Markdown Editor</span>
                            <div className="toolbar-actions">
                                <button className="btn-secondary" onClick={handleCancel}>
                                    <X size={18} />
                                    Cancel
                                </button>
                                <button className="btn-primary" onClick={handleSave}>
                                    <Save size={18} />
                                    Save Changes
                                </button>
                            </div>
                        </div>
                        <textarea
                            className="markdown-editor"
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            placeholder="Enter lesson content in Markdown..."
                        />
                        <div className="editor-preview">
                            <h4>Preview:</h4>
                            <div className="prose">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {editedContent}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="lesson-content prose">
                        {currentLesson.content ? (
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    p: ({ children }) => {
                                        // Robustly check for [!NOTE] at the start
                                        const childrenArray = Array.isArray(children) ? children : [children];
                                        const firstChild = childrenArray[0];
                                        let isNote = false;

                                        // 1. Check plain text
                                        if (typeof firstChild === 'string' && /\[!NOTE\]/i.test(firstChild)) {
                                            isNote = true;
                                        }
                                        // 2. Check nested element (e.g. **[!NOTE]**)
                                        else if (typeof firstChild === 'object' && firstChild?.props?.children) {
                                            const grandkids = Array.isArray(firstChild.props.children) ? firstChild.props.children : [firstChild.props.children];
                                            if (typeof grandkids[0] === 'string' && /\[!NOTE\]/i.test(grandkids[0])) {
                                                isNote = true;
                                            }
                                        }

                                        if (isNote) {
                                            // Cleanup logic
                                            const cleanedChildren = childrenArray.map((child, idx) => {
                                                if (idx !== 0) return child;

                                                if (typeof child === 'string') {
                                                    return child.replace(/\[!NOTE\]/i, '').replace(/^:/, '').trim();
                                                }
                                                // Handle nested element by cloning
                                                if (typeof child === 'object' && child?.props?.children) {
                                                    // We assume it's a React element if it's an object here
                                                    // Actually we can just render the children of the element if we want to strip the Bold wrapper?
                                                    // Or we can try to strip the text from the children.
                                                    const grandkids = Array.isArray(child.props.children) ? child.props.children : [child.props.children];
                                                    const newGrandkids = [...grandkids];
                                                    if (typeof newGrandkids[0] === 'string') {
                                                        newGrandkids[0] = newGrandkids[0].replace(/\[!NOTE\]/i, '').replace(/^:/, '').trim();
                                                    }
                                                    return newGrandkids;
                                                }
                                                return child;
                                            });

                                            return (
                                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r shadow-sm">
                                                    <div className="flex items-center gap-2 font-bold text-blue-700 mb-2">
                                                        <Info size={18} />
                                                        <span>Note</span>
                                                    </div>
                                                    <div className="text-blue-900 m-0">
                                                        {cleanedChildren}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return <p className="mb-4 leading-relaxed text-slate-700">{children}</p>;
                                    },
                                    blockquote: ({ children }) => {
                                        // Handle blockquote-style notes > [!NOTE]
                                        // The children of a blockquote are usually paragraphs.
                                        // We need to inspect the first paragraph's text.

                                        const childrenArray = Array.isArray(children) ? children : [children];

                                        // Check if the first child is a paragraph and contains the note tag
                                        let isNoteBlockquote = false;
                                        let cleanedChildren = children;

                                        if (childrenArray.length > 0 && typeof childrenArray[0] === 'object' && childrenArray[0].type === 'p') {
                                            const pChildren = Array.isArray(childrenArray[0].props.children) ? childrenArray[0].props.children : [childrenArray[0].props.children];
                                            const firstPChild = pChildren[0];

                                            if (typeof firstPChild === 'string' && /\[!NOTE\]/i.test(firstPChild)) {
                                                isNoteBlockquote = true;
                                                // Create new children for the paragraph, stripping the [!NOTE]
                                                const newPChildren = pChildren.map((child: any, idx: number) => {
                                                    if (idx === 0 && typeof child === 'string') {
                                                        return child.replace(/\[!NOTE\]/i, '').replace(/^:/, '').trim();
                                                    }
                                                    return child;
                                                });
                                                // Replace the original paragraph with the cleaned one
                                                cleanedChildren = [
                                                    {
                                                        ...childrenArray[0],
                                                        props: {
                                                            ...childrenArray[0].props,
                                                            children: newPChildren
                                                        }
                                                    },
                                                    ...childrenArray.slice(1)
                                                ];
                                            }
                                        }

                                        if (isNoteBlockquote) {
                                            return (
                                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r shadow-sm">
                                                    <div className="flex items-center gap-2 font-bold text-blue-700 mb-2">
                                                        <Info size={18} />
                                                        <span>Note</span>
                                                    </div>
                                                    <div className="text-blue-900 m-0">
                                                        {cleanedChildren}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return <blockquote className="border-l-4 border-gray-300 pl-4 py-1 my-4 italic text-gray-700">{children}</blockquote>;
                                    }
                                }}
                            >
                                {currentLesson.content}
                            </ReactMarkdown>
                        ) : (
                            <p className="empty-state">No content available. Click "Edit Lesson" to add content.</p>
                        )}
                    </div>
                )}

                {/* Navigation */}
                <div className="lesson-nav">
                    {prevLesson ? (
                        <button
                            className="btn-secondary nav-btn"
                            onClick={() => navigate(`/lesson/${prevLesson.moduleId}-${allLessons.indexOf(prevLesson)}`)}
                        >
                            <ArrowLeft size={18} />
                            {prevLesson.title}
                        </button>
                    ) : <div />}

                    {nextLesson ? (
                        <button
                            className="btn-primary nav-btn"
                            onClick={() => navigate(`/lesson/${nextLesson.moduleId}-${allLessons.indexOf(nextLesson)}`)}
                        >
                            {nextLesson.title}
                            <ArrowRight size={18} />
                        </button>
                    ) : (
                        <Link to="/path" className="btn-primary">
                            Back to Path
                        </Link>
                    )}
                </div>
            </Card>
        </div>
    );
}
