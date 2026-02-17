import React from 'react'
import Image from 'next/image'

interface ModalProps {
  src?: string;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ src, onClose }) => {

  if (!src) return null;

  return (
    <div id="modal"
      className="flex fixed top-0 left-0 w-screen h-screen bg-black/90 justify-center items-center"
      style={{ zIndex: 80, position: "fixed" }}>

      <a className="fixed top-6 right-8 text-white text-5xl font-bold cursor-pointer"
        onClick={onClose} style={{ zIndex: 90 }}>
        &times;
      </a>
      <Image
        src={src}
        fill={true}
        alt="zoomed-in image"
        style={{ objectFit: "contain" }}
      />
    </div >)
}

export default Modal
