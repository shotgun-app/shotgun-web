import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import UserAvatar from '../UserAvatar.vue'
import { apiUrl } from '@/utils/apiUrl'

describe('UserAvatar.vue', () => {
  it('shows the initials without a picture', () => {
    const wrapper = mount(UserAvatar, { props: { name: 'Ana Novak', src: null } })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('AN')
  })

  it('shows the picture from the backend when there is one', () => {
    const wrapper = mount(UserAvatar, {
      props: { name: 'Ana Novak', src: '/api/images/profile/u1.png' },
    })

    expect(wrapper.get('img').attributes('src')).toBe(apiUrl('/api/images/profile/u1.png'))
    expect(wrapper.text()).toBe('')
  })
})
