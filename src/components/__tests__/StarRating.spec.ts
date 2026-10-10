import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import StarRating from '../StarRating.vue'

describe('StarRating.vue', () => {
  it('always draws five stars, filling the rounded value', () => {
    const wrapper = mount(StarRating, { props: { value: 3.6, label: 'Driver rating' } })

    expect(wrapper.findAll('svg')).toHaveLength(5)
    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('Driver rating: 3.6 out of 5')
  })
})
