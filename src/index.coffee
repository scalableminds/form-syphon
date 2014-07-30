getter = (obj, key) ->
  if obj[key]
    return obj[key]
  else
    return obj.default


assignKeyValue = (obj, keychain, value) ->
  if not keychain
    return obj

  key = keychain.shift()

  # build the current object we need to store data
  if not obj[key]
    obj[key] = if _.isArray(key) then [] else {}

  # if it's the last key in the chain, assign the value directly
  if keychain.length == 0
    if _.isArray(obj[key])
      obj[key].push(value)
    else
      obj[key] = value

  # recursive parsing of the array, depth-first
  if keychain.length > 0
    assignKeyValue(obj[key], keychain, value)

  return obj


flattenData = (data, parentKey, keyJoiner) ->

  flatData = {}

  _.each(data, (value, keyName) ->
    hash = {}

    # If there is a parent key, join it with
    # the current, child key.
    if parentKey
      keyName = keyJoiner(parentKey, keyName)

    if _.isArray(value)
      keyName += "[]"
      hash[keyName] = value
    else if _.isPlainObject(value)
      hash = flattenData(value, keyName, keyJoiner)
    else
      hash[keyName] = value

    # Store the resulting key/value pairs in the
    # final flattened data object
    _.extend(flatData, hash)
  )

  return flatData


getElementType = ($el) ->
  type = $el.prop("tagName").toLowerCase()
  if type == "input"
    type = $el.attr("type") or "text"
  return type


FormSyphon =

  serialize : ($el) ->
    result = {}

    _.forEach($el.find(":input"), (input) =>
      $input = $(input)
      type = getElementType($input)

      keychain = @keySplitter(@keyExtractor($input))
      return if not keychain

      value = getter(@readers, type)($input)
      if getter(@keyAssignmentValidators, type)($input, keychain, value)
        assignKeyValue(result, keychain, value)
    )
    return result


  deserialize : ($el, data) ->

    flatData = flattenData(data, null, @keyJoiner)
    _.forEach($el.find(":input"), (input) =>
      $input = $(input)
      type = getElementType($input)

      key = @keyExtractor($input)
      return if not key

      getter(@writers, type)($input, flatData[key])
    )
    return

  keyAssignmentValidators : {
    default : ->
      return true

    radio : ($el, key, value) ->
      return $el.prop("checked")
  }

  readers : {
    default : ($el) ->
      return $el.val()

    number : ($el) ->
      return parseInt($el.val())

    checkbox : ($el) ->
      return $el.prop("checked")

    date : ($el) ->
      return new Date($el.val())
  }

  writers : {
    default : ($el, value) ->
      $el.val(value)

    date : ($el, value) ->
      $el.val(value.toJSON().substring(0, 10))

    checkbox : ($el, value) ->
      $el.prop("checked", value)

    radio : ($el, value) ->
      $el.prop("checked", $(el).val() == value.toString())
  }

  keyExtractor : ($el) ->
    return $el.prop("name")

  keyJoiner : (parentKey, key) ->
    return "#{parentKey}[#{childKey}]"

  keySplitter : (key) ->
    matches = key.match(/[^\[\]]+/g)

    if key.length > 1 and key.indexOf("[]") == key.length - 2
      lastKey = matches.pop()
      matches.push([ lastKey ])

    return matches || null
