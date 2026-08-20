import { useRef, useState, useCallback} from 'react'

export function useWhiteboardCanvas(socket, boardId) {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const isDrawing = useRef(false)
  const currentStroke = useRef(null)

  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#1f2937')
  const [width, setWidth] = useState(3)
  const [history, setHistory] = useState([]) // for undo tracking locally

  const initCanvas = useCallback((canvas) => {
    if (!canvas) return
    canvasRef.current = canvas
    const ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctxRef.current = ctx
  }, [])

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
  }

  const drawStroke = useCallback((stroke) => {
    const ctx = ctxRef.current
    if (!ctx) return

    ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.width

    if (stroke.tool === 'pen' || stroke.tool === 'eraser') {
      if (stroke.points.length < 2) return
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      stroke.points.forEach(p => ctx.lineTo(p.x, p.y))
      ctx.stroke()
    } else if (stroke.tool === 'rectangle') {
      ctx.strokeRect(stroke.startX, stroke.startY, stroke.endX - stroke.startX, stroke.endY - stroke.startY)
    } else if (stroke.tool === 'circle') {
      const radius = Math.hypot(stroke.endX - stroke.startX, stroke.endY - stroke.startY)
      ctx.beginPath()
      ctx.arc(stroke.startX, stroke.startY, radius, 0, 2 * Math.PI)
      ctx.stroke()
    } else if (stroke.tool === 'line') {
      ctx.beginPath()
      ctx.moveTo(stroke.startX, stroke.startY)
      ctx.lineTo(stroke.endX, stroke.endY)
      ctx.stroke()
    } else if (stroke.tool === 'text') {
      ctx.fillStyle = stroke.color
      ctx.font = `${stroke.fontSize || 20}px sans-serif`
      ctx.fillText(stroke.text, stroke.startX, stroke.startY)
    }
  }, [])

  const redrawAll = useCallback((strokes) => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    strokes.forEach(s => drawStroke(s))
  }, [drawStroke])

  const startDrawing = (e) => {
    if (tool === 'text') return // handled separately
    isDrawing.current = true
    const pos = getPos(e)

    if (tool === 'pen' || tool === 'eraser') {
      currentStroke.current = {
        id: Date.now().toString(), tool, color, width: tool === 'eraser' ? width * 3 : width,
        points: [pos] }
    } else {
      currentStroke.current = {
        id: Date.now().toString(), tool, color, width,
        startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y }
    }
  }

  const draw = (e) => {
    if (!isDrawing.current || !currentStroke.current) return
    const pos = getPos(e)

    if (tool === 'pen' || tool === 'eraser') {
      currentStroke.current.points.push(pos)
    } else {
      currentStroke.current.endX = pos.x
      currentStroke.current.endY = pos.y
    }

    // Redraw entire canvas + current stroke for live preview (shapes need this to not stack)
    if (tool !== 'pen' && tool !== 'eraser') {
      redrawAll(history)
    }
    drawStroke(currentStroke.current)

    // Broadcast live preview to others (throttled by browser repaint rate naturally)
    if (socket) socket.emit('drawing_stroke', { boardId, stroke: currentStroke.current })
  }

  const stopDrawing = () => {
    if (!isDrawing.current || !currentStroke.current) return
    isDrawing.current = false

    setHistory(prev => [...prev, currentStroke.current])
    if (socket) socket.emit('stroke_complete', { boardId, stroke: currentStroke.current })
    currentStroke.current = null
  }

  const addTextAt = (x, y, text) => {
    const stroke = { id: Date.now().toString(), tool: 'text', color, fontSize: width * 6 + 10, startX: x, startY: y, text }
    drawStroke(stroke)
    setHistory(prev => [...prev, stroke])
    if (socket) socket.emit('stroke_complete', { boardId, stroke })
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHistory([])
    if (socket) socket.emit('clear_board', { boardId })
  }

  const undo = () => {
    if (socket) socket.emit('undo_stroke', { boardId })
  }

  return {
    canvasRef, initCanvas, tool, setTool, color, setColor, width, setWidth,
    startDrawing, draw, stopDrawing, addTextAt, clearCanvas, undo,
    history, setHistory, redrawAll, drawStroke }
}