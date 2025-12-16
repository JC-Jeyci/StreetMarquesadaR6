import numpy as np
import cv2
import os
import os.path
import pickle
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
from keras._tf_keras.keras.models import load_model
import argparse
from model.constants.exceptionBaseError import ErrorHandlerProcess
from model.constants.responseError import ResponseError
responseError = ResponseError()

class IMGPreditor:
    
    def procesarImagenTexto(self, img_path):
        try:
            ap = argparse.ArgumentParser()
            # Agregar argumentos
            ap.add_argument("-i", "--input", type=str, default=img_path, help="La ruta de la imagen de entrada")
            ap.add_argument("-o", "--output", type=str, default="./model/img/predicted-captchas", help="La ruta de salida para el resultado")
            # La version 05 es la mas estable
            ap.add_argument("-m", "--model", type=str, default="./model/mod/version_10/captcha_extractor_model.hdf5",help="La ruta del modelo")
            ap.add_argument("-lb", "--labels", type=str, default="./model/mod/version_10/captcha_labels.pickle", help="La ruta de las etiquetas")
            
            # Parsear los argumentos de la línea de comandos
            args = ap.parse_args()
            
            # Cargando el modelo que predice las imagenes
            model = load_model(args.model)
            with open(args.labels, "rb") as f:
                lb = pickle.load(f)
                
            # Convirtiendo la imagen a escala de grises
            image = cv2.imread(args.input)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Agregando bordes al rededor de la imagen
            gray = cv2.copyMakeBorder(gray, 8, 8, 8, 8, cv2.BORDER_REPLICATE)

            # Corrigiendo el ruido en la imagen
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            # blurred = cv2.bilateralFilter(gray, 9, 75, 75)

            adaptive_thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)

            # Obtener los limites de la imagen
            thresh = cv2.threshold(adaptive_thresh, 127, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]

            # Dilata la imagen para conectar componentes cercanos
            kernel = np.ones((3, 3), np.uint8)
            dilated = cv2.dilate(thresh, kernel, iterations=1)

            # Encontrando los contornos de la imagen
            contours, hierarchy = cv2.findContours(dilated.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            letter_image_regions = []

            for contour in contours:
                # Contornos encontrados (rectangulos)
                (x, y, w, h) = cv2.boundingRect(contour)
                
                # comprobando si algún contador es demasiado ancho
                # Si el contorno es demasiado ancho, es posible que haya dos letras unidas o que estén muy cerca una de la otra.
                if w / h > 1.25:
                    half_width = int(w / 2)
                    letter_image_regions.append((x, y, half_width, h))
                    letter_image_regions.append((x + half_width, y, half_width, h))
                else:
                    letter_image_regions.append((x, y, w, h))
                        

            # Ordene las imágenes de letras detectadas según la coordenada x para asegurarse
            # los obtenemos de izquierda a derecha para que coincidamos la imagen correcta con la letra correcta 

            letter_image_regions = sorted(letter_image_regions, key=lambda x: x[0])
            
            # Combinar rectángulos superpuestos
            combined_letter_image_regions = []
            while letter_image_regions:
                rect1 = letter_image_regions.pop(0)
                combined = False
                for i, rect2 in enumerate(letter_image_regions):
                    if self.verificarContornosSobrepuestos(rect1, rect2):
                        x1, y1, w1, h1 = rect1
                        x2, y2, w2, h2 = rect2
                        new_x = min(x1, x2)
                        new_y = min(y1, y2)
                        new_w = max(x1 + w1, x2 + w2) - new_x
                        new_h = max(y1 + h1, y2 + h2) - new_y
                        letter_image_regions[i] = (new_x, new_y, new_w, new_h)
                        combined = True
                        break
                if not combined:
                    combined_letter_image_regions.append(rect1)
                    
            # Create an output image and a list to hold our predicted letters
            output = cv2.merge([gray] * 3)
            predictions = []
                
            # Creating an empty list for storing predicted letters
            predictions = []
    
            # Save out each letter as a single image
            for letter_bounding_box in combined_letter_image_regions:
                # Grab the coordinates of the letter in the image
                x, y, w, h = letter_bounding_box

                # Extract the letter from the original image with a 2-pixel margin around the edge
                letter_image = gray[y - 2:y + h + 2, x - 2:x + w + 2]

                try:
                    letter_image = cv2.resize(letter_image, (30,30))
                        
                    # Turn the single image into a 4d list of images
                    letter_image = np.expand_dims(letter_image, axis=2)
                    letter_image = np.expand_dims(letter_image, axis=0)

                    # making prediction
                    pred = model.predict(letter_image)
                        
                    # Convert the one-hot-encoded prediction back to a normal letter
                    letter = lb.inverse_transform(pred)[0]
                    predictions.append(letter)


                    # draw the prediction on the output image
                    cv2.rectangle(output, (x - 2, y - 2), (x + w + 4, y + h + 4), (0, 255, 0), 1)
                    cv2.putText(output, letter, (x - 5, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 0), 2)
                except Exception as ex:
                    print("Error de letra")


            # Print the captcha's text
            """ captcha_text = "".join(predictions)
            print("CAPTCHA Predictor is {}".format(captcha_text))
            
            if len(captcha_text) > 5:
                captcha_text = captcha_text[:-1]
                
            print("CAPTCHA text is: {}".format(captcha_text)) """
            
            # Print the captcha's text
            captcha_text=""
            captcha_crudo = "".join(predictions)
            print("CAPTCHA Predictor is {}".format(captcha_crudo))
             
            if len(captcha_crudo) > 5:
                captcha_crudo = captcha_crudo[:-1]

            captcha_text = captcha_crudo.replace("_", "")
            print(str(captcha_text))
            print("CAPTCHA text is: {}".format(captcha_text))

            try:
                # Get the folder to save the image in
                save_path = os.path.join(args.output, captcha_text)

                p = os.path.join(save_path+'.png' )
                #writing the image to the output folder
                cv2.imwrite(p, image)
                
                save_pm_path = os.path.join(args.output, captcha_text)
                p = os.path.join(save_pm_path+'_output.png')
                cv2.imwrite(p,output)
                print("Output saved to "+args.output)
            except Exception as ex:
                print("Fallo al guardar la imagen pero se logro obtener el captcha")
            
            return {"codigo": captcha_text}
        except Exception as ex:
            print(str(ex))
            raise ErrorHandlerProcess(responseError.process("Error al obtener el codigo del captcha de la imagen"))
        
    # Función para comprobar si dos rectángulos se superponen
    def verificarContornosSobrepuestos(self, rect1, rect2):
        x1, y1, w1, h1 = rect1
        x2, y2, w2, h2 = rect2
        return not (x1 > x2 + w2 or x1 + w1 < x2 or y1 > y2 + h2 or y1 + h1 < y2)