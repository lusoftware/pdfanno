import { uuid } from 'anno-ui/src/utils'
import toml from 'toml'
import { convertFromExportY } from '../shared/coords'

/**
 * Expose public APIs.
 */
export function expose () {
  window.add = addAnnotation
  window.addAll = addAllAnnotations
  window.delete = deleteAnnotation
  window.RectAnnotation = PublicRectAnnotation
  window.SpanAnnotation = PublicSpanAnnotation
  window.RelationAnnotation = PublicRelationAnnotation
  window.readTOML = readTOML
  window.clear = clear
}

/**
 * Add all annotations.
 *
 * This method expect to get argument made from a TOML file parsed by `window.readTOML`.
 */
export function addAllAnnotations (tomlObject) {

  // let result = {}
  let results = []

  for (const key in tomlObject) {

    let data = tomlObject[key]

    if (typeof data !== 'object') {
      continue
    }

    data.id = key
    data.uuid = uuid()

    let a
    if (data.type === 'span') {
      a = new PublicSpanAnnotation(data)
    } else if (data.type === 'rect') {
      a = new PublicRectAnnotation(data)
    } else if (data.type === 'relation') {
      data.ids = data.ids.map(refId => tomlObject[refId].uuid)
      a = new PublicRelationAnnotation(data)
    } else {
      console.log('Unknown: ', key, data)
    }

    if (a) {
      addAnnotation(a)
      // result[key] = a
      results.push(a)
    }
  }

  // return result
  return results

}

/**
 * Add an annotation, and render it.
 */
export function addAnnotation (publicAnnotation) {

  let a = publicAnnotation.annotation
  window.annoPage.addAnnotation(a)
  a.render()
  a.enableViewMode()
  a.save()
}

/**
 * Delete an annotation, and also detach it from view.
 */
export function deleteAnnotation (publicAnnotation) {

  publicAnnotation.annotation.destroy()
}

/**
 * Rect Annotation Class wrapping the core.
 */
export class PublicRectAnnotation {

  /**
   * Create a rect annotation from a TOML data.
   */
  constructor ({ page, position, label = '', id = 0, uuid = '' }) {

    // Check inputs.
    if (!page || typeof page !== 'number') {
      throw new Error('Set the page as number.')
    }
    if (!position || position.length !== 4) {
      throw new Error('Set the position which includes `x`, `y`, `width` and `height`.')
    }

    // position: String -> Float.
    position = position.map(p => parseFloat(p))

    let rect = window.annoPage.createRectAnnotation({
      uuid,
      x        : position[0],
      y        : convertFromExportY(page, position[1]),
      width    : position[2],
      height   : position[3],
      text     : label,
      color    : '#FF0',
      readOnly : false
    })

    this.annotation = rect
  }
}

/**
 * Rect Annotation Class wrapping the core.
 */
export class PublicSpanAnnotation {

  constructor ({ page, position, label = '', text = '', id = 0, uuid = '', zIndex = 10, textrange = [], color = null }) {

    console.log('PublicSpanAnnotation:', zIndex)

    // Check inputs.
    if (!page || typeof page !== 'number') {
      throw new Error('Set the page as number.')
    }
    if (!position) {
      throw new Error('Set the position.')
    }

    // position: String -> Float.
    position = position.map(p => p.map(pp => parseFloat(pp)))

    // Convert.
    position = position.map(p => {
      return {
        page   : page,
        x      : p[0],
        y      : convertFromExportY(page, p[1]),
        width  : p[2],
        height : p[3]
      }
    })

    let span = window.annoPage.createSpanAnnotation({
      uuid,
      rectangles   : position,
      text         : label,
      color        : color || '#FFEB3B',
      readOnly     : false,
      selectedText : text,
      textRange    : textrange,
      zIndex
    })

    this.annotation = span
  }
}

/**
 * Rect Annotation Class wrapping the core.
 */
export class PublicRelationAnnotation {

  constructor ({ dir, ids, label = '', id = 0, uuid = '' }) {

    // Check inputs.
    if (!dir) {
      throw new Error('Set the dir.')
    }
    if (!ids || ids.length !== 2) {
      throw new Error('Set the ids.')
    }

    let r = window.annoPage.createRelationAnnotation({
      uuid,
      direction : dir,
      rel1      : typeof ids[0] === 'object' ? ids[0].annotation : ids[0],
      rel2      : typeof ids[1] === 'object' ? ids[1].annotation : ids[1],
      text      : label,
      color     : '#FF0000',
      readOnly  : false
    })

    this.annotation = r
  }
}

/**
 * TOML parser.
 */
export const readTOML = toml.parse

/**
 * Delete all annotations.
 */
export function clear () {
  window.annoPage.clearAllAnnotations()
}
